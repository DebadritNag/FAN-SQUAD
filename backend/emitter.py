#!/usr/bin/env python3
"""
Fan Squad Backend - DFL XML Replay Emitter
Parses DFL XML files and streams match events via WebSocket at 10x speed
"""

import asyncio
import json
import xml.etree.ElementTree as ET
from datetime import datetime
from pathlib import Path
import websockets
from typing import Dict, List, Any

SPEED_MULTIPLIER = 10
PORT = 8765

class DFLDataParser:
    def __init__(self, data_dir: Path):
        self.data_dir = data_dir
        self.kpi_map: Dict[str, Dict[str, Any]] = {}
        self.events: List[Dict[str, Any]] = []
        self.init_payload: Dict[str, Any] = {}
        
    def parse_match_information(self) -> Dict[str, Any]:
        """Parse match_information.xml to extract teams, colors, and lineups"""
        xml_path = self.data_dir / "MatchInformations_Anonym.xml"
        tree = ET.parse(xml_path)
        root = tree.getroot()
        
        general = root.find(".//General")
        teams_elem = root.find(".//Teams")
        
        payload = {
            "type": "INIT",
            "matchId": general.get("MatchId"),
            "matchTitle": general.get("MatchTitle"),
            "kickoffTime": general.get("KickoffTime"),
            "result": general.get("Result"),
            "teams": []
        }
        
        for team_elem in teams_elem.findall("Team"):
            team_data = {
                "teamId": team_elem.get("TeamId"),
                "teamName": team_elem.get("TeamName"),
                "shortName": team_elem.get("ShortName"),
                "role": team_elem.get("Role"),
                "primaryColor": team_elem.get("PlayerShirtMainColor"),
                "secondaryColor": team_elem.get("PlayerShirtSecondaryColor"),
                "lineup": team_elem.get("LineUp"),
                "players": []
            }
            
            for player_elem in team_elem.findall(".//Player"):
                player_data = {
                    "personId": player_elem.get("PersonId"),
                    "shirtNumber": player_elem.get("ShirtNumber"),
                    "firstName": player_elem.get("FirstName"),
                    "lastName": player_elem.get("LastName"),
                    "shortname": player_elem.get("Shortname"),
                    "starting": player_elem.get("Starting") == "true",
                    "position": player_elem.get("PlayingPosition"),
                    "teamLeader": player_elem.get("TeamLeader") == "true"
                }
                team_data["players"].append(player_data)
            
            payload["teams"].append(team_data)
        
        return payload
    
    def parse_kpi_data(self):
        """Parse kpi_data.xml to create EVENT_ID -> KPI mapping"""
        xml_path = self.data_dir / "kpi_data_Bayern_Hamburg.xml"
        tree = ET.parse(xml_path)
        root = tree.getroot()
        
        for event_elem in root.findall(".//Event"):
            # Handle ShotAtGoal events with xG
            shot_elem = event_elem.find(".//ShotAtGoal")
            if shot_elem is not None:
                event_id = shot_elem.get("EventId")
                self.kpi_map[event_id] = {
                    "xG": float(shot_elem.get("xG", 0)),
                    "pressure": float(shot_elem.get("Pressure", 0)),
                    "playerSpeed": float(shot_elem.get("PlayerSpeed", 0))
                }
            
            # Handle Play events with xP (pass probability)
            play_elem = event_elem.find(".//Play")
            if play_elem is not None:
                event_id = play_elem.get("EventId")
                self.kpi_map[event_id] = {
                    "xPass": float(play_elem.get("xP", 0)),
                    "pressure": float(play_elem.get("PressureOnPlayer", 0)),
                    "distance": float(play_elem.get("Distance", 0))
                }
    
    def parse_events(self):
        """Parse event_anonym.xml and merge with KPI data"""
        xml_path = self.data_dir / "Events_Anonym.xml"
        tree = ET.parse(xml_path)
        root = tree.getroot()
        
        for event_elem in root.findall(".//Event"):
            event_id = event_elem.get("EventId")
            event_time_str = event_elem.get("EventTime")
            
            if not event_time_str:
                continue
            
            event_data = {
                "eventId": event_id,
                "eventTime": event_time_str,
                "xPosition": float(event_elem.get("X-Position", 0)),
                "yPosition": float(event_elem.get("Y-Position", 0)),
                "matchId": event_elem.get("MatchId")
            }
            
            # Merge KPI data if available
            if event_id in self.kpi_map:
                event_data.update(self.kpi_map[event_id])
            
            # Parse specific event types
            if event_elem.find("KickOff") is not None:
                event_data["type"] = "KickOff"
                kickoff = event_elem.find("KickOff")
                event_data["teamLeft"] = kickoff.get("TeamLeft")
                event_data["teamRight"] = kickoff.get("TeamRight")
            
            elif event_elem.find("ShotAtGoal") is not None:
                shot = event_elem.find("ShotAtGoal")
                event_data["type"] = "ShotAtGoal"
                event_data["team"] = shot.get("Team")
                event_data["player"] = shot.get("Player")
                event_data["chanceEvaluation"] = shot.get("ChanceEvaluation")
                
                # Check for goal
                if shot.find("SuccessfulShot") is not None:
                    event_data["goal"] = True
                    event_data["currentResult"] = shot.find("SuccessfulShot").get("CurrentResult")
                
                # Check for woodwork
                if shot.find("ShotWoodWork") is not None:
                    event_data["woodwork"] = True
                
                # Check for blocked shot
                if shot.find("BlockedShot") is not None:
                    event_data["blocked"] = True
            
            elif event_elem.find("Foul") is not None:
                foul = event_elem.find("Foul")
                event_data["type"] = "Foul"
                event_data["fouler"] = foul.get("Fouler")
                event_data["fouled"] = foul.get("Fouled")
            
            elif event_elem.find("Caution") is not None:
                caution = event_elem.find("Caution")
                event_data["type"] = "Caution"
                event_data["player"] = caution.get("Player")
                event_data["cardColor"] = caution.get("CardColor")
            
            elif event_elem.find("TacklingGame") is not None:
                tackle = event_elem.find("TacklingGame")
                event_data["type"] = "TacklingGame"
                event_data["winner"] = tackle.get("Winner")
                event_data["loser"] = tackle.get("Loser")
            
            elif event_elem.find("Play") is not None:
                play = event_elem.find("Play")
                event_data["type"] = "Play"
                event_data["team"] = play.get("Team")
                event_data["player"] = play.get("Player")
                event_data["evaluation"] = play.get("Evaluation")
                
                # Check for FairPlay (values-driven feature)
                if play.get("Evaluation") == "successfullyCompleted":
                    event_data["fairPlay"] = True
            
            self.events.append(event_data)
        
        # Sort events by time
        self.events.sort(key=lambda e: e["eventTime"])
    
    def calculate_momentum_score(self) -> Dict[str, float]:
        """
        Simplified positional abstraction: Calculate average X-coordinate per team
        Returns momentum score (-1 to 1, negative = home team pressure, positive = away team pressure)
        """
        # For now, return a simple momentum based on recent events
        # In production, this would parse Positions_bayern_hamburg.xml
        return {"momentumScore": 0.0}
    
    def load_all_data(self):
        """Load and parse all XML files"""
        print("📊 Parsing match information...")
        self.init_payload = self.parse_match_information()
        
        print("📈 Parsing KPI data...")
        self.parse_kpi_data()
        
        print("⚽ Parsing events...")
        self.parse_events()
        
        print(f"✅ Loaded {len(self.events)} events")


class WebSocketServer:
    def __init__(self, parser: DFLDataParser):
        self.parser = parser
        self.clients = set()
    
    async def handler(self, websocket):
        """Handle WebSocket connection"""
        self.clients.add(websocket)
        print(f"🔌 Client connected. Total clients: {len(self.clients)}")
        
        try:
            # Send INIT payload
            await websocket.send(json.dumps(self.parser.init_payload))
            print("📤 Sent INIT payload")
            
            # Stream events
            await self.stream_events(websocket)
            
        except websockets.exceptions.ConnectionClosed:
            print("🔌 Client disconnected")
        finally:
            self.clients.remove(websocket)
    
    async def stream_events(self, websocket):
        """Stream events chronologically at 10x speed"""
        if not self.parser.events:
            print("⚠️  No events to stream")
            return
        
        start_time = datetime.fromisoformat(self.parser.events[0]["eventTime"].replace("+02:00", "+00:00"))
        
        for i, event in enumerate(self.parser.events):
            event_time = datetime.fromisoformat(event["eventTime"].replace("+02:00", "+00:00"))
            
            # Calculate delay
            if i > 0:
                prev_time = datetime.fromisoformat(self.parser.events[i-1]["eventTime"].replace("+02:00", "+00:00"))
                delta = (event_time - prev_time).total_seconds()
                await asyncio.sleep(delta / SPEED_MULTIPLIER)
            
            # Add momentum score
            event["momentumScore"] = self.parser.calculate_momentum_score()["momentumScore"]
            
            # Send event
            payload = {
                "type": "EVENT",
                "data": event
            }
            
            try:
                await websocket.send(json.dumps(payload))
                print(f"📤 [{i+1}/{len(self.parser.events)}] {event.get('type', 'Unknown')} @ {event['eventTime']}")
            except websockets.exceptions.ConnectionClosed:
                break
        
        # Send completion message
        await websocket.send(json.dumps({"type": "COMPLETE"}))
        print("✅ Stream complete")
    
    async def start(self):
        """Start WebSocket server"""
        async with websockets.serve(self.handler, "0.0.0.0", PORT):
            print(f"🚀 WebSocket server running on ws://0.0.0.0:{PORT}")
            print(f"📱 Connect from Android/iOS: ws://192.168.0.104:{PORT}")
            print(f"⚡ Speed: {SPEED_MULTIPLIER}x")
            await asyncio.Future()  # Run forever


async def main():
    # Determine data directory
    data_dir = Path(__file__).parent.parent / "fan-squad"
    
    if not data_dir.exists():
        print(f"❌ Data directory not found: {data_dir}")
        return
    
    # Parse data
    parser = DFLDataParser(data_dir)
    parser.load_all_data()
    
    # Start server
    server = WebSocketServer(parser)
    await server.start()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n👋 Server stopped")

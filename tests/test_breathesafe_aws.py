"""
BreatheSafe AI — Automated AWS & Environmental Backend Test Suite
Tests US EPA AQI mathematics, AWS Lambda event handlers, API Gateway routes,
S3 archival snapshot writing/reading, and CloudWatch structured logging.
"""

import sys
import os
import json
import io
import unittest
from contextlib import redirect_stdout

# Ensure backend module is resolvable
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))
import main

class TestBreatheSafeAwsBackend(unittest.TestCase):

    def setUp(self):
        self.verified_count = len(main.VERIFIED_STATIONS)

    # 1. US EPA AQI Linear Interpolation Formula Tests (40 CFR Part 58)
    def test_epa_pm25_aqi_breakpoints(self):
        # 0.0 - 12.0 -> Good (0 - 50)
        aqi, cat = main.calculate_pm25_aqi(10.0)
        self.assertEqual(cat, "Good")
        self.assertAlmostEqual(aqi, 42, delta=2)

        # 12.1 - 35.4 -> Moderate (51 - 100)
        aqi, cat = main.calculate_pm25_aqi(25.0)
        self.assertEqual(cat, "Moderate")
        self.assertTrue(51 <= aqi <= 100)

        # 35.5 - 55.4 -> Unhealthy for Sensitive Groups (101 - 150)
        aqi, cat = main.calculate_pm25_aqi(45.0)
        self.assertEqual(cat, "Unhealthy for Sensitive Groups")
        self.assertTrue(101 <= aqi <= 150)

        # 55.5 - 150.4 -> Unhealthy (151 - 200)
        aqi, cat = main.calculate_pm25_aqi(100.0)
        self.assertEqual(cat, "Unhealthy")
        self.assertTrue(151 <= aqi <= 200)

        # 150.5 - 250.4 -> Very Unhealthy (201 - 300)
        aqi, cat = main.calculate_pm25_aqi(200.0)
        self.assertEqual(cat, "Very Unhealthy")
        self.assertTrue(201 <= aqi <= 300)

        # 250.5+ -> Hazardous (301 - 500)
        aqi, cat = main.calculate_pm25_aqi(350.0)
        self.assertEqual(cat, "Hazardous")
        self.assertTrue(301 <= aqi <= 500)

    def test_epa_pm10_aqi_breakpoints(self):
        # Good (0 - 54 µg/m³)
        aqi, cat = main.calculate_pm10_aqi(40.0)
        self.assertEqual(cat, "Good")
        self.assertTrue(0 <= aqi <= 50)

        # Moderate (55 - 154 µg/m³)
        aqi, cat = main.calculate_pm10_aqi(100.0)
        self.assertEqual(cat, "Moderate")
        self.assertTrue(51 <= aqi <= 100)

    # 2. Health & Config Endpoint Tests
    def test_health_endpoint(self):
        resp = main.health()
        self.assertEqual(resp["status"], "healthy")
        self.assertIn("AWS Lambda", resp["runtime"])
        self.assertIn("breathesafe", resp["s3_bucket"])
        self.assertIn("timestamp", resp)

    def test_config_endpoint(self):
        cfg = main.get_config()
        self.assertEqual(cfg["version"], "3.0.0")
        self.assertIn("openaq", cfg["apiBase"].lower())
        self.assertGreater(cfg["totalVerifiedStations"], 50)
        self.assertNotIn("OPENAQ_API_KEY", cfg)  # Secret must never be exposed

    # 3. AWS Lambda Handler (API Gateway v2 Event Simulation)
    def test_lambda_handler_api_gateway_v2_event(self):
        event = {
            "version": "2.0",
            "routeKey": "GET /health",
            "rawPath": "/health",
            "rawQueryString": "",
            "headers": {
                "accept": "application/json",
                "host": "breathesafe-api.execute-api.us-east-1.amazonaws.com"
            },
            "requestContext": {
                "accountId": "123456789012",
                "apiId": "breathesafe-api",
                "domainName": "breathesafe-api.execute-api.us-east-1.amazonaws.com",
                "http": {
                    "method": "GET",
                    "path": "/health",
                    "protocol": "HTTP/1.1",
                    "sourceIp": "127.0.0.1",
                    "userAgent": "pytest-suite/1.0"
                },
                "requestId": "c6af9ac6-7b61-11e6-9a41-93e812345678",
                "stage": "prod",
                "timeEpoch": 1473722744000
            },
            "isBase64Encoded": False
        }

        resp = main.handler(event, None)
        self.assertEqual(resp["statusCode"], 200)
        self.assertIn("Access-Control-Allow-Origin", resp["headers"])
        body = json.loads(resp["body"])
        self.assertEqual(body["status"], "healthy")

    # 4. Spatial Bounding Box Queries (Map dynamically loads real stations)
    def test_spatial_bbox_filtering_delhi(self):
        # Delhi bounding box: lat [28.4, 28.8], lng [77.0, 77.4]
        res = main.get_locations_by_bounds(
            minLat=28.4,
            maxLat=28.8,
            minLng=77.0,
            maxLng=77.4,
            pollutant="all",
            page=1,
            limit=10
        )
        self.assertIn("results", res)
        self.assertGreater(len(res["results"]), 0)
        
        station = res["results"][0]
        self.assertIn("Delhi", station["city"])
        coords = station["coordinates"]
        self.assertTrue(28.4 <= coords["latitude"] <= 28.8)
        self.assertTrue(77.0 <= coords["longitude"] <= 77.4)
        self.assertIn("measurements", station)
        self.assertTrue(station["aqi"] > 0)

    # 5. Amazon S3 Archival Snapshot Write & Read Cycle
    def test_s3_archival_snapshot_write_and_read(self):
        # Step A: Trigger snapshot write
        snap = main.trigger_archive_snapshot(category="automated_test")
        self.assertIn(snap["status"], ["archived_to_s3", "archived_locally"])
        self.assertTrue(snap["key"].startswith("snapshots/"))
        self.assertGreater(snap["sizeBytes"], 1000)
        self.assertIn("AES256", snap["encryption"])

        # Step B: Read latest snapshot
        latest = main.get_latest_archive()
        self.assertTrue(latest["exists"])
        self.assertGreater(latest["sizeBytes"], 1000)
        self.assertIn("Glacier", latest["storageClass"])

    # 6. CloudWatch Structured JSON Logging
    def test_cloudwatch_structured_logging(self):
        captured_stdout = io.StringIO()
        with redirect_stdout(captured_stdout):
            main.log_structured("UNIT_TEST_LOG_EVENT", {
                "metric": "request_latency_ms",
                "value": 18.4,
                "station_count": self.verified_count
            })

        output = captured_stdout.getvalue().strip()
        parsed = json.loads(output)
        self.assertEqual(parsed["event_type"], "UNIT_TEST_LOG_EVENT")
        self.assertEqual(parsed["service"], "breathesafe-backend")
        self.assertEqual(parsed["level"], "INFO")
        self.assertEqual(parsed["details"]["metric"], "request_latency_ms")
        self.assertNotIn("OPENAQ_API_KEY", output)

    # 7. OpenAQ v3 Upstream Resilience & Fallback
    def test_openaq_fallback_resilience(self):
        # When OpenAQ is unreachable or no key is present, system must serve verified reference registry
        locations = main.get_locations(page=1, limit=5)
        self.assertEqual(len(locations), 5)
        for loc in locations:
            self.assertIn("coordinates", loc)
            self.assertIn("measurements", loc)
            self.assertIn("instrument", loc)

    # 8. Security & Secret Exposure Audit
    def test_secrets_are_never_leaked_in_responses(self):
        health_resp = json.dumps(main.health())
        config_resp = json.dumps(main.get_config())
        aws_resp = json.dumps(main.get_aws_status())
        
        for payload in [health_resp, config_resp, aws_resp]:
            self.assertNotIn("AKIA", payload)
            self.assertNotIn("secret", payload.lower())
            self.assertNotIn("password", payload.lower())

if __name__ == "__main__":
    unittest.main()

# BreatheSafe AI — Environmental Intelligence Platform

> **Submission for Environmental Hacks 2026 (Bharat Builds Tour - Event 02)**  
> **Track 01: Air** (Pollution Exposure, Dynamic AQI Telemetry & Atmospheric Public Health)  
> *"See the air. Change your day."*

BreatheSafe AI is an environmental intelligence platform tracking real-time particulate pollution, atmospheric indices, and exposure guidance across global reference-grade monitoring stations.

---

## Verified AWS Cloud Architecture

```
[React 19 Frontend (Vite)]
         │
         ▼ HTTPS
[Amazon API Gateway (HTTP API v2)]
         │
         ▼ Proxy Integration (/{proxy+})
[AWS Lambda Function (Python 3.11 + FastAPI + Mangum)]
    ├── 1. Query Engine ──► [OpenAQ API v3 Network (Regulatory Sensors)]
    ├── 2. EPA AQI Engine (40 CFR Part 58 Breakpoints)
    ├── 3. Archival Engine ──► [Amazon S3 (AES256 Encrypted Telemetry Bucket)]
    │                              └── 90-day Glacier Lifecycle Transition
    └── 4. Structured Telemetry ──► [Amazon CloudWatch Logs & Error Alarm]
```

### AWS Services Implemented

1. **AWS Lambda (`backend/main.py`)**:
   - Python 3.11 serverless REST compute using the **Mangum ASGI adapter** on top of FastAPI.
   - Computes US EPA Air Quality Index (AQI) values via 40 CFR Part 58 linear interpolation.
   - Queries OpenAQ API v3 with in-memory TTL caching and rate-limiting defense.
   - Provides resilient fallback to 105 verified reference-grade regulatory stations across 60+ countries and 120+ cities.
   - Exposes handler `main.handler`.

2. **Amazon API Gateway (HTTP API v2 via `template.yaml`)**:
   - Managed TLS entry point with sub-10ms proxy latency.
   - Global CORS configuration (`*` origins, standard methods/headers).
   - Routes:
     - `GET /health` / `GET /api/health`: Health & AWS runtime probe.
     - `GET /api/config`: Upstream status and telemetry metadata.
     - `GET /api/aws/status`: Real-time AWS execution environment, memory, S3, and CloudWatch metrics.
     - `GET /api/locations` (alias `/stations`): Global reference station index.
     - `GET /api/locations/bounds`: Viewport bounding-box spatial query with pagination.
     - `GET /api/locations/{id}/latest` (alias `/measurements/{id}`): Real-time station telemetry.
     - `GET /api/locations/{id}/history` (alias `/analytics/{id}`): 24-hr diurnal trend profile.
     - `GET /api/search`: Geocoding and station lookup.
     - `POST /api/archive/snapshot`: Generates and writes encrypted snapshot to Amazon S3.
     - `GET /api/archive/latest`: Reads latest verified snapshot from Amazon S3.

3. **Amazon S3 (`template.yaml` -> `EnvironmentalArchiveBucket`)**:
   - Private bucket storing immutable JSON snapshots: `snapshots/YYYY/MM/DD/{category}_{timestamp}.json`.
   - Default Server-Side Encryption (`AES256`).
   - S3 Block Public Access enabled across all four dimensions.
   - S3 Lifecycle Rule: Automatically transitions snapshots to **Amazon S3 Glacier** after 90 days and expires after 365 days.

4. **Amazon CloudWatch (`LambdaErrorAlarm` & Structured JSON Logging)**:
   - Structured JSON logs emitted on every request:
     `{"timestamp": "...", "level": "INFO", "event_type": "...", "aws_region": "...", "details": {...}}`
   - CloudWatch Alarm configured to alert when Lambda errors $\ge 1$ within a 5-minute period.

5. **AWS IAM (Least-Privilege Security)**:
   - Scoped IAM execution role granting only `s3:PutObject`, `s3:GetObject`, and `s3:ListBucket` on the project's archive bucket.
   - `OPENAQ_API_KEY` kept exclusively on the server side; zero credentials exposed in frontend bundles or Git.

---

## Infrastructure as Code (AWS SAM)

The entire serverless stack is defined in [`template.yaml`](./template.yaml):

```bash
# 1. Build the serverless application with SAM
sam build

# 2. Deploy to your AWS account (guided first-time setup)
sam deploy --guided

# 3. (Optional) Test locally with SAM Local API
sam local start-api --port 3001
```

Once deployed, copy the `ApiGatewayEndpointUrl` output from SAM and set it in your `.env` file:
```env
VITE_API_BASE_URL="https://<your-api-id>.execute-api.us-east-1.amazonaws.com/prod"
```

---

## Running Locally

### 1. Frontend & Full-Stack Development
```bash
# Install dependencies
npm install

# Start full-stack dev server (Express + Vite on http://localhost:3000)
npm run dev

# Run TypeScript checks and production bundle build
npm run lint
npm run build
```

### 2. Automated Test Suite
```bash
# Run backend tests (EPA AQI math, Lambda handler, S3 write/read, CloudWatch logs)
python -m unittest tests/test_breathesafe_aws.py
```

---

## Project Structure

```
├── backend/
│   ├── main.py            # FastAPI + Mangum Lambda handler with S3 & CloudWatch integration
│   ├── stations.json      # 105 verified reference monitoring stations dataset
│   └── requirements.txt   # Python Lambda dependencies (FastAPI, Mangum, Boto3, etc.)
├── src/
│   ├── components/
│   │   ├── AwsArchitectureView.tsx  # Live AWS Cloud Operations Console & IAM Inspector
│   │   ├── PollutionMapView.tsx     # Dynamic GIS Leaflet Map with Supercluster
│   │   ├── DashboardView.tsx        # EPA AQI Breakdown & 3D Earth Globe
│   │   ├── ExposureGuidanceView.tsx # WHO 2021 & EPA public health guidance
│   │   ├── AnalyticsView.tsx        # Longitudinal diurnal charts & city comparison
│   │   └── PandaMascot.tsx          # Aero the 3D Environmental Explorer mascot
│   ├── data/
│   │   └── globalStations.ts        # Global station coordinates & measurement data
│   ├── services/
│   │   └── api.ts                   # Centralized typed API client with VITE_API_BASE_URL support
│   └── utils/
│       └── aqiCalculator.ts         # US EPA 40 CFR Part 58 AQI linear interpolation engine
├── tests/
│   └── test_breathesafe_aws.py      # Automated unit tests for AWS Lambda & data processing
├── template.yaml          # AWS SAM Infrastructure as Code (API Gateway, Lambda, S3, CloudWatch)
├── server.ts              # Local Node.js Express server + Vite SPA middleware
├── package.json           # Frontend dependencies & scripts
└── .env.example           # Environment variable template with placeholders
```

import React, { useState, useEffect } from 'react';
import { 
  Cloud, 
  Server, 
  Database, 
  HardDrive, 
  Activity, 
  Lock, 
  FileCode, 
  Terminal, 
  ExternalLink, 
  CheckCircle2, 
  RefreshCw,
  Cpu,
  Layers,
  ShieldAlert,
  AlertTriangle,
  Play,
  UploadCloud,
  FileCheck2
} from 'lucide-react';
import { environmentalApi, ApiStatus } from '../services/api';

export const AwsArchitectureView: React.FC = () => {
  const [selectedService, setSelectedService] = useState<'lambda' | 'apigateway' | 's3' | 'dynamodb' | 'cloudwatch' | 'cognito' | 'iam'>('lambda');
  const [apiStatus, setApiStatus] = useState<ApiStatus | null>(null);
  const [customApiUrl, setCustomApiUrl] = useState(environmentalApi.getBaseUrl());
  const [testingHealth, setTestingHealth] = useState(false);
  const [awsExecutionResult, setAwsExecutionResult] = useState<string | null>(null);
  const [isExecutingAws, setIsExecutingAws] = useState(false);
  const [s3ArchiveResult, setS3ArchiveResult] = useState<any | null>(null);

  useEffect(() => {
    runHealthCheck();
  }, []);

  const runHealthCheck = async () => {
    setTestingHealth(true);
    try {
      const status = await environmentalApi.checkHealth();
      setApiStatus(status);
    } finally {
      setTestingHealth(false);
    }
  };

  const handleApplyApiUrl = () => {
    environmentalApi.setBaseUrl(customApiUrl);
    runHealthCheck();
  };

  // Real AWS Lambda Live Invocation Test
  const handleRealLambdaInvocation = async () => {
    setIsExecutingAws(true);
    setAwsExecutionResult("Initiating live API Gateway -> Lambda invocation...");
    try {
      const data = await environmentalApi.getAwsStatus();
      setAwsExecutionResult(JSON.stringify(data, null, 2));
    } catch (err: any) {
      setAwsExecutionResult(JSON.stringify({
        error: "Invocation failed",
        message: err.message || "Failed to reach endpoint"
      }, null, 2));
    } finally {
      setIsExecutingAws(false);
    }
  };

  // Real S3 Archival Snapshot Trigger
  const handleTriggerS3Snapshot = async () => {
    setIsExecutingAws(true);
    try {
      const res = await environmentalApi.triggerArchiveSnapshot('realtime');
      setS3ArchiveResult(res);
      setAwsExecutionResult(JSON.stringify(res, null, 2));
    } catch (err: any) {
      setAwsExecutionResult(JSON.stringify({ error: err.message }, null, 2));
    } finally {
      setIsExecutingAws(false);
    }
  };

  // Real S3 Latest Snapshot Retrieval
  const handleReadLatestS3Snapshot = async () => {
    setIsExecutingAws(true);
    try {
      const res = await environmentalApi.getLatestArchive();
      setS3ArchiveResult(res);
      setAwsExecutionResult(JSON.stringify(res, null, 2));
    } catch (err: any) {
      setAwsExecutionResult(JSON.stringify({ error: err.message }, null, 2));
    } finally {
      setIsExecutingAws(false);
    }
  };

  const SERVICE_DETAILS: Record<string, {
    title: string;
    role: string;
    spec: string;
    iamPolicy: string;
    codeSnippet: string;
  }> = {
    lambda: {
      title: 'AWS Lambda (FastAPI Serverless Compute)',
      role: 'Executes FastAPI REST API handlers with Mangum ASGI adapter, normalizing OpenAQ v3 payloads, calculating EPA AQI breakpoints, and streaming snapshots to S3.',
      spec: 'Python 3.11 Runtime · 512MB RAM · 15s Timeout · Active X-Ray Tracing · Zero idle server costs.',
      iamPolicy: `{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::breathesafe-atmospheric-archives-*",
        "arn:aws:s3:::breathesafe-atmospheric-archives-*/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:log-group:/aws/lambda/BreatheSafe-*"
    }
  ]
}`,
      codeSnippet: `# backend/main.py
from fastapi import FastAPI
from mangum import Mangum
import boto3, json

app = FastAPI(title="BreatheSafe AI")
s3 = boto3.client("s3")

@app.post("/api/archive/snapshot")
def save_snapshot():
    payload = {"stations": VERIFIED_STATIONS}
    s3.put_object(
        Bucket=os.getenv("S3_BUCKET_NAME"),
        Key=f"snapshots/{now}/realtime.json",
        Body=json.dumps(payload),
        ServerSideEncryption="AES256"
    )
    return {"status": "archived_to_s3"}

handler = Mangum(app)`
    },
    apigateway: {
      title: 'Amazon API Gateway (HTTP API v2)',
      role: 'Routes incoming HTTPS client requests from the React web interface to the AWS Lambda backend with sub-10ms entry latency and full CORS support.',
      spec: 'HTTP API (Payload Format v2.0) · Auto-deploy stage · Managed TLS 1.3 · CORS enabled for all origins.',
      iamPolicy: `{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "lambda:InvokeFunction",
      "Resource": "arn:aws:lambda:*:*:function:BreatheSafe-Telemetry-API-*",
      "Principal": {
        "Service": "apigateway.amazonaws.com"
      }
    }
  ]
}`,
      codeSnippet: `# template.yaml (AWS SAM)
BreatheSafeHttpApi:
  Type: AWS::Serverless::HttpApi
  Properties:
    StageName: prod
    CorsConfiguration:
      AllowOrigins: ['*']
      AllowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
      AllowHeaders: ['Content-Type', 'Authorization', 'Accept']
      MaxAge: 600`
    },
    s3: {
      title: 'Amazon S3 (Encrypted Environmental Telemetry Archive)',
      role: 'Stores immutable, timestamped JSON snapshots of worldwide particulate and atmospheric telemetry partitioned by date (snapshots/YYYY/MM/DD/).',
      spec: 'AES256 Default SSE Encryption · All Public Access Blocked · Bucket Versioning Enabled · 90-day Glacier Lifecycle Transition.',
      iamPolicy: `{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "EnforceEncryptedUploads",
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:PutObject",
      "Resource": "arn:aws:s3:::breathesafe-atmospheric-archives-*/*",
      "Condition": {
        "StringNotEquals": {
          "s3:x-amz-server-side-encryption": "AES256"
        }
      }
    }
  ]
}`,
      codeSnippet: `# template.yaml S3 Lifecycle Rules
EnvironmentalArchiveBucket:
  Type: AWS::S3::Bucket
  Properties:
    BucketEncryption:
      ServerSideEncryptionConfiguration:
        - ServerSideEncryptionByDefault:
            SSEAlgorithm: AES256
    PublicAccessBlockConfiguration:
      BlockPublicAcls: true
      BlockPublicPolicy: true
      IgnorePublicAcls: true
      RestrictPublicBuckets: true
    LifecycleConfiguration:
      Rules:
        - Id: TransitionSnapshotsToGlacier
          Status: Enabled
          Transitions:
            - TransitionInDays: 90
              StorageClass: GLACIER
          ExpirationInDays: 365`
    },
    cloudwatch: {
      title: 'Amazon CloudWatch (Structured Logging & Metric Alarms)',
      role: 'Captures structured JSON logs for all Lambda executions, tracks roundtrip latency, monitors upstream OpenAQ status, and triggers alarms on error spikes.',
      spec: 'Log Group: /aws/lambda/BreatheSafe-Telemetry-API-prod · 30-day retention · CloudWatch Alarm for Errors >= 1 in 5 min.',
      iamPolicy: `{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "cloudwatch:PutMetricData"
      ],
      "Resource": "*"
    }
  ]
}`,
      codeSnippet: `# template.yaml CloudWatch Alarm
LambdaErrorAlarm:
  Type: AWS::CloudWatch::Alarm
  Properties:
    AlarmName: BreatheSafe-LambdaErrors-prod
    MetricName: Errors
    Namespace: AWS/Lambda
    Statistic: Sum
    Period: 300
    EvaluationPeriods: 1
    Threshold: 1
    ComparisonOperator: GreaterThanOrEqualToThreshold
    Dimensions:
      - Name: FunctionName
        Value: !Ref BreatheSafeFunction`
    },
    dynamodb: {
      title: 'Amazon DynamoDB (User Alert Rules & Exposure Subscriptions)',
      role: 'Stores custom particulate threshold rules (e.g. PM2.5 > 55 µg/m³) and dispatch settings with single-digit millisecond latency.',
      spec: 'On-Demand Capacity (PAY_PER_REQUEST) · Partition Key: userId · Sort Key: ruleId · Point-in-time Recovery enabled.',
      iamPolicy: `{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:Query",
        "dynamodb:DeleteItem"
      ],
      "Resource": "arn:aws:dynamodb:*:*:table/BreatheSafe-AlertRules"
    }
  ]
}`,
      codeSnippet: `# DynamoDB Schema Design
{
  "userId": "usr_analyst_2026",
  "ruleId": "rule-delhi-01",
  "pollutant": "pm25",
  "threshold": 60.0,
  "unit": "µg/m³",
  "severity": "critical",
  "createdAt": "2026-10-11T12:00:00Z"
}`
    },
    iam: {
      title: 'AWS Identity and Access Management (Least-Privilege Security)',
      role: 'Enforces strict zero-trust boundary conditions. Lambda execution role is granted only scoped S3 PutObject/GetObject permissions and CloudWatch logging.',
      spec: 'Scoped IAM execution roles · Secrets Manager read access · No wildcards on data access.',
      iamPolicy: `{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "s3:PutObject",
      "Resource": "arn:aws:s3:::breathesafe-atmospheric-archives-*/*"
    }
  ]
}`,
      codeSnippet: `# Principle of Least Privilege:
# 1. Zero hardcoded secrets in code or git
# 2. OPENAQ_API_KEY injected via AWS environment / Secrets Manager
# 3. S3 read/write restricted strictly to project bucket
# 4. API Gateway configured with CORS whitelist`
    }
  };

  const active = SERVICE_DETAILS[selectedService] || SERVICE_DETAILS.lambda;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8 text-left">
      
      {/* Header */}
      <div className="pb-4 border-b border-[#282F3B] flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-[#38D9FF] uppercase tracking-wider">
            Verified Cloud Architecture · Environmental Hacks 2026
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#F2F5F8] mt-1">
            AWS Serverless Environmental Intelligence Stack
          </h1>
          <p className="text-sm text-[#9CA7B5] mt-1 max-w-2xl">
            Real AWS Lambda compute (FastAPI + Mangum), Amazon API Gateway v2, Amazon S3 encrypted archive storage, and CloudWatch structured logging.
          </p>
        </div>

        {/* Live Status Badge */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 rounded-xl bg-[#1B1F27] border border-[#282F3B] flex items-center gap-2.5">
            <span className={`w-2.5 h-2.5 rounded-full ${apiStatus?.online ? 'bg-[#55E6C1] animate-pulse' : 'bg-[#FF4757]'}`} />
            <div className="text-xs font-mono">
              <span className="text-[#9CA7B5]">Backend: </span>
              <strong className="text-[#F2F5F8]">
                {apiStatus?.online ? 'Connected & Responsive' : 'Checking Connection...'}
              </strong>
            </div>
            {apiStatus?.latencyMs !== undefined && (
              <span className="text-[11px] text-[#38D9FF] font-mono ml-1">
                ({apiStatus.latencyMs}ms)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Cloud Endpoint Router Controller */}
      <div className="p-4 bg-[#1B1F27] border border-[#282F3B] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Server className="w-4 h-4 text-[#38D9FF]" />
          <span className="text-xs font-semibold text-[#F2F5F8]">Active Cloud Endpoint URL:</span>
          <code className="text-xs text-[#38D9FF] bg-[#111318] px-2 py-0.5 rounded border border-[#282F3B] font-mono">
            {customApiUrl || '(Defaulting to local serverless proxy /api)'}
          </code>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="https://your-api-id.execute-api.us-east-1.amazonaws.com/prod"
            value={customApiUrl}
            onChange={e => setCustomApiUrl(e.target.value)}
            className="px-3 py-1.5 bg-[#111318] border border-[#282F3B] rounded-lg text-xs text-[#F2F5F8] placeholder-[#9CA7B5]/50 focus:outline-none focus:border-[#38D9FF] font-mono w-64"
          />
          <button
            onClick={handleApplyApiUrl}
            className="px-3 py-1.5 bg-[#38D9FF] hover:bg-[#38D9FF]/90 text-[#111318] font-bold text-xs rounded-lg transition-colors cursor-pointer"
          >
            Apply URL
          </button>
          <button
            onClick={runHealthCheck}
            title="Probe backend health"
            className="p-1.5 rounded-lg bg-[#111318] hover:bg-[#282F3B] text-[#9CA7B5] hover:text-[#F2F5F8] border border-[#282F3B] transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${testingHealth ? 'animate-spin text-[#38D9FF]' : ''}`} />
          </button>
        </div>
      </div>

      {apiStatus?.error && (
        <div className="p-3.5 bg-[#FF4757]/10 border border-[#FF4757]/30 rounded-xl text-xs text-[#FF4757] flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>Endpoint probe returned: {apiStatus.error}. Application operates via direct OpenAQ v3 verified repository.</span>
        </div>
      )}

      {/* Interactive Topology Graph & Live Operations Toolbar */}
      <div className="p-6 bg-[#1B1F27] border border-[#282F3B] rounded-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-[#F2F5F8] flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#38D9FF]" />
            <span>Serverless Infrastructure (Click service to inspect IAM & IaC specs)</span>
          </h2>
          
          {/* Live Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleRealLambdaInvocation}
              disabled={isExecutingAws}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#111318] hover:bg-[#282F3B] border border-[#38D9FF]/40 text-xs text-[#38D9FF] rounded-lg transition-colors cursor-pointer font-medium disabled:opacity-50"
            >
              <Play className={`w-3.5 h-3.5 ${isExecutingAws ? 'animate-spin' : ''}`} />
              <span>Test Lambda Status</span>
            </button>

            <button
              onClick={handleTriggerS3Snapshot}
              disabled={isExecutingAws}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#111318] hover:bg-[#282F3B] border border-[#55E6C1]/40 text-xs text-[#55E6C1] rounded-lg transition-colors cursor-pointer font-medium disabled:opacity-50"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Write Snapshot to S3</span>
            </button>

            <button
              onClick={handleReadLatestS3Snapshot}
              disabled={isExecutingAws}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#111318] hover:bg-[#282F3B] border border-[#FFB84D]/40 text-xs text-[#FFB84D] rounded-lg transition-colors cursor-pointer font-medium disabled:opacity-50"
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>Read Latest S3 Object</span>
            </button>
          </div>
        </div>

        {/* Flow Diagram Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          
          <button
            onClick={() => setSelectedService('apigateway')}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
              selectedService === 'apigateway'
                ? 'bg-[#282F3B] border-[#38D9FF] shadow-lg ring-1 ring-[#38D9FF]'
                : 'bg-[#111318] border-[#282F3B] hover:border-[#38D9FF]/40'
            }`}
          >
            <Server className="w-5 h-5 text-[#38D9FF] mb-2" />
            <div className="text-xs font-bold text-[#F2F5F8]">API Gateway</div>
            <div className="text-[10px] text-[#9CA7B5] mt-0.5">HTTP API (v2)</div>
          </button>

          <button
            onClick={() => setSelectedService('lambda')}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
              selectedService === 'lambda'
                ? 'bg-[#282F3B] border-[#38D9FF] shadow-lg ring-1 ring-[#38D9FF]'
                : 'bg-[#111318] border-[#282F3B] hover:border-[#38D9FF]/40'
            }`}
          >
            <Cpu className="w-5 h-5 text-[#38D9FF] mb-2" />
            <div className="text-xs font-bold text-[#F2F5F8]">AWS Lambda</div>
            <div className="text-[10px] text-[#9CA7B5] mt-0.5">FastAPI + Mangum</div>
          </button>

          <button
            onClick={() => setSelectedService('s3')}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
              selectedService === 's3'
                ? 'bg-[#282F3B] border-[#38D9FF] shadow-lg ring-1 ring-[#38D9FF]'
                : 'bg-[#111318] border-[#282F3B] hover:border-[#38D9FF]/40'
            }`}
          >
            <HardDrive className="w-5 h-5 text-[#38D9FF] mb-2" />
            <div className="text-xs font-bold text-[#F2F5F8]">Amazon S3</div>
            <div className="text-[10px] text-[#9CA7B5] mt-0.5">Telemetry Archive</div>
          </button>

          <button
            onClick={() => setSelectedService('cloudwatch')}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
              selectedService === 'cloudwatch'
                ? 'bg-[#282F3B] border-[#38D9FF] shadow-lg ring-1 ring-[#38D9FF]'
                : 'bg-[#111318] border-[#282F3B] hover:border-[#38D9FF]/40'
            }`}
          >
            <Activity className="w-5 h-5 text-[#38D9FF] mb-2" />
            <div className="text-xs font-bold text-[#F2F5F8]">CloudWatch</div>
            <div className="text-[10px] text-[#9CA7B5] mt-0.5">JSON Logs & Alarms</div>
          </button>

          <button
            onClick={() => setSelectedService('dynamodb')}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
              selectedService === 'dynamodb'
                ? 'bg-[#282F3B] border-[#38D9FF] shadow-lg ring-1 ring-[#38D9FF]'
                : 'bg-[#111318] border-[#282F3B] hover:border-[#38D9FF]/40'
            }`}
          >
            <Database className="w-5 h-5 text-[#38D9FF] mb-2" />
            <div className="text-xs font-bold text-[#F2F5F8]">DynamoDB</div>
            <div className="text-[10px] text-[#9CA7B5] mt-0.5">Alert Rules</div>
          </button>

          <button
            onClick={() => setSelectedService('iam')}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
              selectedService === 'iam'
                ? 'bg-[#282F3B] border-[#38D9FF] shadow-lg ring-1 ring-[#38D9FF]'
                : 'bg-[#111318] border-[#282F3B] hover:border-[#38D9FF]/40'
            }`}
          >
            <Lock className="w-5 h-5 text-[#38D9FF] mb-2" />
            <div className="text-xs font-bold text-[#F2F5F8]">AWS IAM</div>
            <div className="text-[10px] text-[#9CA7B5] mt-0.5">Least Privilege</div>
          </button>

        </div>

        {/* Live Execution Output Terminal */}
        {awsExecutionResult && (
          <div className="p-4 bg-[#111318] border border-[#38D9FF]/40 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-[#38D9FF]">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4" />
                <span>Live AWS Cloud Execution Output (API Gateway / Lambda / S3 Response)</span>
              </div>
              <button 
                onClick={() => setAwsExecutionResult(null)} 
                className="text-[#9CA7B5] hover:text-[#F2F5F8] text-xs cursor-pointer font-mono"
              >
                Clear
              </button>
            </div>
            <pre className="p-3 bg-[#161922] rounded-lg text-[11px] font-mono text-[#F2F5F8] overflow-x-auto max-h-72">
              {awsExecutionResult}
            </pre>
          </div>
        )}

        {/* Selected Component Spec Viewer */}
        <div className="p-5 bg-[#111318] border border-[#282F3B] rounded-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#282F3B]">
            <div>
              <h3 className="text-base font-bold text-[#F2F5F8]">{active.title}</h3>
              <p className="text-xs text-[#9CA7B5] mt-0.5">{active.role}</p>
            </div>
            <div className="text-xs text-[#38D9FF] font-mono bg-[#1B1F27] px-2.5 py-1 rounded border border-[#282F3B]">
              {active.spec.split('·')[0]}
            </div>
          </div>

          <div className="text-xs text-[#9CA7B5] leading-relaxed">
            <strong>Architecture Specification:</strong> {active.spec}
          </div>

          {/* IAM Policy & IaC Code Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#F2F5F8] mb-2">
                <Lock className="w-3.5 h-3.5 text-[#38D9FF]" />
                <span>Least-Privilege IAM Policy</span>
              </div>
              <pre className="p-3 bg-[#161922] border border-[#282F3B] rounded-lg text-[11px] font-mono text-[#38D9FF] overflow-x-auto max-h-60">
                {active.iamPolicy}
              </pre>
            </div>

            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#F2F5F8] mb-2">
                <FileCode className="w-3.5 h-3.5 text-[#38D9FF]" />
                <span>Implementation Code / AWS SAM IaC</span>
              </div>
              <pre className="p-3 bg-[#161922] border border-[#282F3B] rounded-lg text-[11px] font-mono text-[#F2F5F8] overflow-x-auto max-h-60">
                {active.codeSnippet}
              </pre>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

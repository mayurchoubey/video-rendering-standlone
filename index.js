#!/usr/bin/env node

const { renderMediaOnLambda } = require('@remotion/lambda');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config();

// Configuration from environment variables
const config = {
  region: process.env.AWS_REGION || "us-east-1",
  lambdaFunction: process.env.REMOTION_LAMBDA_FUNCTION || "remotion-render-4-0-315-mem2048mb-disk2048mb-240sec",
  serverUrl: process.env.REMOTION_SERVER_URL || "https://remotionlambda-useast1-3rne5v73bs.s3.us-east-1.amazonaws.com/sites/dev/index.html",
  bucket: process.env.REMOTION_BUCKET || "remotionlambda-useast1-3rne5v73bs"
};

// Function to load JSON data from file
function loadVideoData(jsonFilePath) {
  try {
    const fullPath = path.resolve(jsonFilePath);
    console.log(`Loading video data from: ${fullPath}`);
    
    if (!fs.existsSync(fullPath)) {
      throw new Error(`JSON file not found: ${fullPath}`);
    }
    
    const jsonData = fs.readFileSync(fullPath, 'utf8');
    const videoData = JSON.parse(jsonData);
    
    console.log('✅ Video data loaded successfully');
    return videoData;
  } catch (error) {
    console.error('❌ Error loading video data:', error.message);
    throw error;
  }
}

// Function to wait for render completion by checking S3
async function waitForRenderCompletion(renderId, outputKey) {
  console.log(`\n⏳ Waiting for render to complete...`);
  console.log(`Render ID: ${renderId}`);
  console.log(`Output file: ${outputKey}`);
  
  // Import AWS SDK for S3 check
  const AWS = require('aws-sdk');
  const s3 = new AWS.S3({ region: config.region });
  
  let attempts = 0;
  const maxAttempts = 120; // Wait up to 10 minutes (120 * 5 seconds)
  
  while (attempts < maxAttempts) {
    try {
      attempts++;
      console.log(`\n🔍 Checking S3 for output file (attempt ${attempts}/${maxAttempts})...`);
      
      // Check if the file exists in S3
      try {
        await s3.headObject({
          Bucket: config.bucket,
          Key: outputKey
        }).promise();
        
        console.log(`\n✅ Video file found in S3! Render completed successfully!`);
        return { status: 'completed', outputKey };
        
      } catch (s3Error) {
        if (s3Error.code === 'NotFound') {
          console.log(`🔄 Video file not ready yet... (attempt ${attempts}/${maxAttempts})`);
        } else {
          console.log(`⚠️  S3 check error: ${s3Error.message}`);
        }
      }
      
      // Wait 5 seconds before next check
      console.log(`⏱️  Waiting 5 seconds before next check...`);
      await new Promise(resolve => setTimeout(resolve, 5000));
      
    } catch (error) {
      console.error(`\n❌ Error during completion check: ${error.message}`);
      attempts++;
      
      if (attempts >= maxAttempts) {
        throw new Error('Maximum attempts reached while waiting for render completion');
      }
      
      // Wait 5 seconds before retry
      console.log(`⏱️  Waiting 5 seconds before retry...`);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  
  throw new Error('Timeout waiting for render completion');
}

async function createVideo(
  filePath,
  jsonFilePath = 'video-data.json',
  composition = 'RenderVideo'
) {
  try {
    console.log('Starting video creation...');
    console.log('Configuration:', {
      region: config.region,
      functionName: config.lambdaFunction,
      bucket: config.bucket,
      jsonFile: jsonFilePath,
      composition: composition
    });

    // Load video data from JSON file
    const videoData = loadVideoData(jsonFilePath);

    console.log('🚀 Initiating render on Lambda...');
    const { renderId, bucketName } = await renderMediaOnLambda({
      region: config.region,
      functionName: config.lambdaFunction,
      serveUrl: config.serverUrl,
      composition: composition,
      inputProps: videoData,
      codec: "h264",
      outName: {
        bucketName: config.bucket,
        key: filePath,
      },
      imageFormat: "jpeg",
      maxRetries: 1,
      framesPerLambda: 1000,
      privacy: "public",
    });

    console.log(`✅ Render initiated successfully!`);
    console.log(`🆔 Render ID: ${renderId}`);

    // Wait for render completion by checking S3
    await waitForRenderCompletion(renderId, filePath);

    const url = `https://${bucketName}.s3.${config.region}.amazonaws.com/${filePath}`;

    console.log('\n🎉 Video creation completed successfully!');
    console.log('📁 Video URL:', url);

    return { id: renderId, url };
  } catch (error) {
    console.error('Error creating video:', error);
    throw error;
  }
}

// CLI functionality
function showHelp() {
  console.log(`
🎬 Remotion Video Renderer Utility

Usage:
  node index.js [options] <json-file> [output-file]

Options:
  --composition, -c    Composition name (default: RenderVideo)
  --help, -h          Show this help message
  --version, -v       Show version

Arguments:
  json-file           Path to JSON file containing video data
  output-file         Output filename (default: video.mp4)

Environment Variables:
  AWS_REGION                    AWS region (default: us-east-1)
  REMOTION_LAMBDA_FUNCTION      Lambda function name
  REMOTION_SERVER_URL          Remotion server URL
  REMOTION_BUCKET              S3 bucket name

Examples:
  node index.js video-data.json
  node index.js video-data.json my-video.mp4
  node index.js --composition MyComposition video-data.json
  REMOTION_LAMBDA_FUNCTION=my-function node index.js video-data.json
`);
}

function showVersion() {
  const packageJson = require('./package.json');
  console.log(`Version: ${packageJson.version}`);
}

// Main CLI function
async function main() {
  const args = process.argv.slice(2);
  
  // Parse command line arguments
  let jsonFilePath = null;
  let outputFileName = 'video.mp4';
  let composition = 'RenderVideo';
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--help' || arg === '-h') {
      showHelp();
      return;
    }
    
    if (arg === '--version' || arg === '-v') {
      showVersion();
      return;
    }
    
    if (arg === '--composition' || arg === '-c') {
      composition = args[i + 1];
      i++; // Skip next argument as it's the composition value
      continue;
    }
    
    // If it's not a flag, it's a file path
    if (!arg.startsWith('-')) {
      if (!jsonFilePath) {
        jsonFilePath = arg;
      } else {
        outputFileName = arg;
      }
    }
  }
  
  if (!jsonFilePath) {
    console.error('❌ Error: JSON file path is required');
    console.log('Use --help for usage information');
    process.exit(1);
  }
  
  try {
    console.log(`Using JSON file: ${jsonFilePath}`);
    console.log(`Output file: ${outputFileName}`);
    console.log(`Composition: ${composition}`);
    
    const result = await createVideo(outputFileName, jsonFilePath, composition);
    
    console.log('\n=== RESULT ===');
    console.log('ID:', result.id);
    console.log('URL:', result.url);
  } catch (error) {
    console.error('Failed to create video:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { createVideo, loadVideoData, config };

// /services/userService.js
const { AppError } = require("../middleware/errorHandler");
const { renderMediaOnLambda } = require('@remotion/lambda-client');
// Import AWS SDK for S3 check
const AWS = require('aws-sdk');

const dotenv = require('dotenv');
dotenv.config();
// Configuration from environment variables
// const config = {
//   region: process.env.AWS_REGION || "us-east-1",
//   lambdaFunction: process.env.REMOTION_LAMBDA_FUNCTION || "remotion-render-4-0-315-mem2048mb-disk2048mb-240sec",
//   serverUrl: process.env.REMOTION_SERVER_URL || "https://remotionlambda-useast1-3rne5v73bs.s3.us-east-1.amazonaws.com/sites/dev/index.html",
//   bucket: process.env.REMOTION_BUCKET || "remotionlambda-useast1-3rne5v73bs"
// };

const config = {
  region:  "us-east-1",
  lambdaFunction:  "remotion-render-4-0-315-mem2048mb-disk2048mb-240sec",
  serverUrl: "https://remotionlambda-useast1-3rne5v73bs.s3.us-east-1.amazonaws.com/sites/dev/index.html",
  bucket: "remotionlambda-useast1-3rne5v73bs"
};

async function waitForRenderCompletion(renderId, outputKey,bucketName,outputFileName) {
  console.log(`\n⏳ Waiting for render to complete...`);
  console.log(`Render ID: ${renderId}`);
  console.log(`Output file: ${outputKey}`);
  

  
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
        const url = `https://${bucketName}.s3.${config.region}.amazonaws.com/${outputFileName}`;
        console.log(`\n✅ Video file found in S3! Render completed successfully!`);
        return { status: 'completed',  data: {
          fileURL: url,
          outputKey,
          renderId
        } };
        
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
        return { status: 'error',  message: "Maximum attempts reached while waiting for render completion", error };
        //throw new Error('Maximum attempts reached while waiting for render completion');
      }
      
      // Wait 5 seconds before retry
      console.log(`⏱️  Waiting 5 seconds before retry...`);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  
  throw new Error('Timeout waiting for render completion');
}

async function createVideo(
    outputFileName,
    jsonData = 'video-data.json',
    composition = 'RenderVideo'
) {
  try {
    console.log('Starting video creation...');
    console.log('Configuration:', {
      region: config.region,
      functionName: config.lambdaFunction,
      bucket: config.bucket,
      jsonData: jsonData,
      composition: composition
    });

    // Load video data from JSON file
    //const videoData = loadVideoData(jsonFilePath);

    console.log('🚀 Initiating render on Lambda...');
    const { renderId, bucketName } = await renderMediaOnLambda({
      region: config.region,
      functionName: config.lambdaFunction,
      serveUrl: config.serverUrl,
      composition: composition,
      inputProps: jsonData,
      codec: "h264",
      outName: {
        bucketName: config.bucket,
        key: outputFileName,
      },
      imageFormat: "jpeg",
      maxRetries: 1,
      framesPerLambda: 1000,
      privacy: "public",
    });

    console.log(`✅ Render initiated successfully!`);
    console.log(`🆔 Render ID: ${renderId}`);

    // Wait for render completion by checking S3
    const response = await waitForRenderCompletion(renderId, outputFileName,bucketName,outputFileName);

    const url = `https://${bucketName}.s3.${config.region}.amazonaws.com/${outputFileName}`;

    console.log('\n🎉 Video creation completed successfully!');
    console.log('📁 Video URL:', url);

    return response;
  } catch (error) {
    console.error('Error creating video:', error);
    throw error;
  }
}

const  generateVideo = async (jsonData=null, outputFileName= 'video.mp4',composition = 'RenderVideo') => {
  if (!jsonData) {
    console.error('❌ Error: JSON Data is required');
    
    return {status: "error", message:"Error: JSON Data is required"};
  }
  
  try {
    console.log(`Using JSON data:  `,jsonData);
    console.log(`Output file: ${outputFileName}`);
    console.log(`Composition: ${composition}`);
    
    const result = await createVideo(outputFileName, jsonData, composition);
    return result;
    console.log('\n=== RESULT ===');
    console.log('ID:', result.id);
    console.log('URL:', result.url);
  } catch (error) {
    console.error('Failed to create video:', error);
    process.exit(1);
  }

}
class VideoService {
   

  async createVideo(videoData, outputFileName) {
    return await generateVideo(videoData, outputFileName);
    //return await User?.create && User.create(userData);
  }
 
}

module.exports = new VideoService();

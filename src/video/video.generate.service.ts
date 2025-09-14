// /services/userService.js
import {getRenderProgress, renderMediaOnLambda} from '@remotion/lambda/client';
//const { renderMediaOnLambda } = require('@remotion/lambda-client');
// Import AWS SDK for S3 check
//const AWS = require('aws-sdk');
import AWS from "aws-sdk";
import dotenv from "dotenv";
 
// Configuration from environment variables
// const config = {
//   region: process.env.AWS_REGION || "us-east-1",
//   lambdaFunction: process.env.REMOTION_LAMBDA_FUNCTION || "remotion-render-4-0-315-mem2048mb-disk2048mb-240sec",
//   serverUrl: process.env.REMOTION_SERVER_URL || "https://remotionlambda-useast1-3rne5v73bs.s3.us-east-1.amazonaws.com/sites/dev/index.html",
//   bucket: process.env.REMOTION_BUCKET || "remotionlambda-useast1-3rne5v73bs"
// };
dotenv.config();
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
      dotenv.config();
      attempts++;
      console.log(`\n🔍 Checking S3 for output file (attempt ${attempts}/${maxAttempts})...`,{
        Bucket: config.bucket,
        Key: outputKey
      });
      
      // Check if the file exists in S3
      try {
        // await s3.headObject({
        //   Bucket: config.bucket,
        //   Key: outputKey
        // }).promise();
        const progress = await getRenderProgress({
          renderId: renderId,
          bucketName: bucketName,
          functionName: config.lambdaFunction,
          region: "us-east-1",
        });
        console.log("progress",progress);

        if(progress?.done){
          const url = `https://${bucketName}.s3.${config.region}.amazonaws.com/${outputFileName}`;
          console.log(`\n✅ Video file found in S3! Render completed successfully!`);
          return { status: 'success',  data: {
            fileURL: url,
            bucketName,
            message: "Video file was created successfully",
            outputKey,
            renderId
          } };
        } else {
          console.log("Video file is not ready..");
        }
        
        
      } catch (s3Error) {
        if (s3Error.code === 'NotFound') {
          console.log(`🔄 Video file not ready yet... (attempt ${attempts}/${maxAttempts})`);
        } else {
          console.log(`⚠️  S3 check error: `,s3Error);
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
    jsonData,
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

    console.log('🚀 Initiating render on Lambda...', JSON.stringify({
      region: "us-east-1",
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
    }));
    const { renderId, bucketName } = await renderMediaOnLambda({
      region: "us-east-1",
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
    return {status: "error", message:"Failed to create video", error};
  }
}

export const  generateVideo = async (jsonData=null, outputFileName= 'video.mp4',composition = 'RenderVideo') => {
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
  } catch (error) {
    console.error('Failed to create video:', error);
    return {status: "error", message:"Failed to create video", error};
  }

}
export class GenerateVideoService {
   

  async createVideo(videoData, outputFileName) {
    return await generateVideo(videoData, outputFileName);
    //return await User?.create && User.create(userData);
  }
 
}


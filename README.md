# Remotion Video Renderer Utility

A standalone utility for rendering videos using Remotion Lambda. This tool allows you to render videos from JSON data files without needing the full Remotion codebase.

## Features

- 🚀 Render videos using Remotion Lambda
- 📁 Load video data from JSON files
- ⏳ Monitor render progress with S3 polling
- 🔧 Configurable via environment variables
- 📝 Command-line interface with help
- 🎬 Support for custom compositions

## Installation

1. Clone or download this utility to your desired location
2. Install dependencies:

```bash
cd /Users/mayur/newworkspace/video-render-utility
npm install
```

## Configuration

Create a `.env` file in the utility directory with your AWS and Remotion configuration:

```bash
cp .env.example .env
```

Then edit `.env` with your settings:

```env
AWS_REGION=us-east-1
REMOTION_LAMBDA_FUNCTION=your-lambda-function-name
REMOTION_SERVER_URL=https://your-remotion-server-url
REMOTION_BUCKET=your-s3-bucket-name
```

## Usage

### Basic Usage

```bash
# Render a video from JSON data
node index.js video-data.json

# Specify output filename
node index.js video-data.json my-video.mp4

# Use a custom composition
node index.js --composition MyComposition video-data.json
```

### Command Line Options

- `--composition, -c`: Composition name (default: RenderVideo)
- `--help, -h`: Show help message
- `--version, -v`: Show version

### Environment Variables

- `AWS_REGION`: AWS region (default: us-east-1)
- `REMOTION_LAMBDA_FUNCTION`: Lambda function name
- `REMOTION_SERVER_URL`: Remotion server URL
- `REMOTION_BUCKET`: S3 bucket name

## JSON Data Format

The utility expects a JSON file containing video data. The structure should match what your Remotion composition expects. For example:

```json
{
  "design": {
    "id": "unique-id",
    "size": {
      "width": 1080,
      "height": 1920
    },
    "fps": 30,
    "tracks": [
      {
        "id": "track-id",
        "type": "text",
        "items": ["item-id"]
      }
    ]
  }
}
```

## Examples

### Example 1: Basic Video Rendering

```bash
# Create a simple video
node index.js simple-video.json output.mp4
```

### Example 2: Using Environment Variables

```bash
# Set environment variables and render
REMOTION_LAMBDA_FUNCTION=my-custom-function node index.js data.json
```

### Example 3: Custom Composition

```bash
# Use a different composition
node index.js --composition MyCustomComposition video-data.json
```

## Output

The utility will:

1. Load and validate the JSON data
2. Initiate the render on AWS Lambda
3. Monitor progress by polling S3
4. Display the final video URL when complete

Example output:
```
✅ Video data loaded successfully
🚀 Initiating render on Lambda...
✅ Render initiated successfully!
🆔 Render ID: abc123-def456-ghi789
⏳ Waiting for render to complete...
🔍 Checking S3 for output file (attempt 1/120)...
✅ Video file found in S3! Render completed successfully!
🎉 Video creation completed successfully!
📁 Video URL: https://your-bucket.s3.us-east-1.amazonaws.com/output.mp4
```

## Error Handling

The utility includes comprehensive error handling:

- JSON file validation
- AWS credential checking
- Render timeout handling (10 minutes max)
- S3 polling with retry logic

## Requirements

- Node.js 14.0.0 or higher
- Valid AWS credentials configured
- Access to the specified Remotion Lambda function
- Valid JSON data file

## Troubleshooting

### Common Issues

1. **AWS Credentials**: Ensure your AWS credentials are properly configured
2. **Lambda Function**: Verify the Lambda function name and region are correct
3. **JSON Format**: Check that your JSON file is valid and matches expected structure
4. **Permissions**: Ensure you have S3 read/write permissions

### Debug Mode

For more detailed logging, you can modify the script to add additional console.log statements or use a logging library.

## License

MIT

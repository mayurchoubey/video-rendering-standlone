import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { VideoService } from './video.service';
import { CreateVideoDto } from './dto/create-video.dto';

@Controller('video')
export class VideoController {
    constructor(private readonly videoService: VideoService) { }
    @Get()
    findAll() {
        return this.videoService.findAll();  // GET /video
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.videoService.findOne(+id);  // GET /video/1
    }

    @Post("generate")
    async create(@Body() reqBody: any) {
        console.log(reqBody);
        let outputFileName = "", videoData = null;
        if (reqBody?.outputFileName) {
            outputFileName = reqBody?.outputFileName;
            videoData = reqBody?.videoData;
        } else {
            const randId = Math.floor(Math.random() * 9999) + 1;
            outputFileName = `demo-vid-${randId}.mp4`;
            videoData = reqBody;
        }
        const newVideo: any = await this.videoService.generate(videoData, outputFileName);
        if (newVideo?.status === "success") {
            return { statusCode: 201, ...newVideo }
        } else {
            return { statusCode: 500, ...newVideo }
        }
    }
    // @Post()
    // create(@Body() createVideoDto: CreateVideoDto) {
    //     return this.videoService.create(createVideoDto);  // POST /video
    // }

}

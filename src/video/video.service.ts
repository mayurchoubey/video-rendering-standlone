import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateVideoDto } from './dto/create-video.dto';
import { generateVideo, GenerateVideoService } from './video.generate.service';
const dummyVideos = [{
    name: "one",
    age: 1,
    bread:"bone",
    id:1, 
},{
    name: "two",
    age: 2,
    bread:"btwo",
    id:2, 
}]
@Injectable()
export class VideoService {
  private videos:any = dummyVideos;

  create(dto: CreateVideoDto) {
    const newVideo = { id: Date.now(), ...dto };
    this.videos.push(newVideo);
    return newVideo;
  }

  findAll() {
    return this.videos;
  }

  findOne(id: number) {
    const video = this.videos.find(c => c.id === id);
    if (!video) {
      throw new NotFoundException(`Video #${id} not found`);
    }
    return video;
  }
  async generate(videoData: any, outputFileName: any){
    return await generateVideo(videoData, outputFileName);
  }
}

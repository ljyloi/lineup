import { createClient } from "@/lib/server";
import { form } from "@nextui-org/theme";
import { NextRequest, NextResponse } from "next/server";
import AWS from "aws-sdk"
import {S3Client, PutObjectCommand}from "@aws-sdk/client-s3"
import crypto from "crypto"
import { v4 as uuidv4 } from 'uuid';

// Cloudflare R2 配置（兼容 S3）
const r2Endpoint = new AWS.Endpoint(process.env.R2_ENDPOINT);
const s3 = new S3Client({
  endpoint: r2Endpoint,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
  region: "auto", // R2 不需要区域，但 AWS SDK 要求填写
});

function generateFileName() {
    const ext = ".png"
    return `${Date.now()}-${randomStr}${ext}`
}

async function uploadImage(img) {
    console.log("img:", img)
    if (!img) {
        return {
            filename: "",
            url: ""
        } 
    }

    const ext = img.name.split('.').pop();
    const randomStr = crypto.randomBytes(16).toString("hex");

    const arrayBuffer = await img.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer)
    
    console.log(buffer)

    const filename = `${Date.now()}-${randomStr}.${ext}`;
    const url = `${process.env.R2_ACCESS_DOMAIN}/${filename}`

    console.log("img filename", filename)

    const putCommand = new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: filename,
        Body: buffer,
        ContentType: img.type,
        ACL: "public-read",
    });
    console.log("上传文件")
    const res = await s3.send(putCommand)
    console.log(res)
    return {
        url: url,
        filename: filename,
    }
}



export async function POST(req) {
    const supabase = await createClient()
    const formData = await req.formData()

    const start = formData.getAll("start") ;
    const end = formData.getAll("end") ;
    const skill = formData.get("skill")
    const map_id = formData.get("map_id")
    const hero_id = formData.get("hero_id")
    const texts = formData.getAll("texts");
    const images = formData.getAll("images") ;
    console.log(skill, map_id, hero_id, start, end, texts, images)

    const descs = []

    const cnt = texts.length

    for (let i = 0; i < cnt; i++) {
        console.log("i:", i)
        try {
            const { filename, url } = await uploadImage(images[i])
            descs.push({
                text: texts[i],
                filename: filename,
                url: url,
            })
        } catch(err) {
            console.log("error: ", err)
        }
    }

    const data ={
        id: uuidv4(),
        map_id: map_id,
        hero_id: hero_id,
        skill: skill,
        descs: descs,
        start: {
            x: start[0],
            y: start[1]
        },
        end: {
            x: end[0],
            y: end[1]
        },
    } 
    console.log(data)

    const resp = await supabase.from('lineup').insert(data)
    
    return NextResponse.json(
        {
            message: resp.statusText,
        },
        {
            status: resp.status
        }
    )
}
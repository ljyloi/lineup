'use client'
import Image from "next/image";
import styles from "./page.module.css";
import useSelectorStore from "@/lib/store";
import { Button, Input, Select } from 'antd';
import {
  CheckSquareOutlined,
  DeleteOutlined
} from '@ant-design/icons';

import { useState , useRef, useEffect } from "react";
import {  useRouter } from "next/navigation";
import { createClient } from "@/lib/client";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

// component status
const PAGE_SHOW = "show"
const PAGE_ADD_0 = "add0"
const PAGE_ADD_1 = "add1"
const PAGE_ADD_2 = "add2"
const RADIUS=15

function drawPoints(canvas, startPoints, endPoints, pointToCanvas) {
  const ctx = canvas.getContext('2d');
  for (let i = 0; i < startPoints.length; i++) {
      const point = pointToCanvas(startPoints[i]);
      ctx.beginPath()
      ctx.arc(point.x, point.y, RADIUS, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
      ctx.fill()
  }

  for (let i = 0; i < endPoints.length; i++) {
      const point = pointToCanvas(endPoints[i]);
      ctx.beginPath()
      ctx.arc(point.x, point.y, RADIUS, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(0, 255, 0, 0.5)';
      ctx.fill()
  }

}

function clearAll(canvas) {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height)
}

function drawLineUp(canvas, lineup, pointToCanvas) {
  drawPoints(canvas, [lineup.start], [lineup.end], pointToCanvas)

  const ctx = canvas.getContext('2d');
  ctx.setLineDash([10, 5]);
  ctx.strokeStyle = 'yellow';
  ctx.lineWidth = 2;

  ctx.beginPath();
  const sp = pointToCanvas(lineup.start)
  const ep = pointToCanvas(lineup.end)
  ctx.moveTo(sp.x, sp.y);
  ctx.lineTo(ep.x, ep.y);
  ctx.stroke();
}

function drawLineUps(canvas, lineups, pointToCanvas) {
  const ctx = canvas.getContext('2d');
  const startPoints = lineups.map((l) => l.start)
  const endPoints = lineups.map((l) => l.end)

  console.log(startPoints)
  console.log(endPoints)

  // draw points
  drawPoints(canvas, startPoints, endPoints, pointToCanvas)
  // draw lines

  for (let i = 0; i < lineups.length; i++) {
      const lineup = lineups[i];
      ctx.setLineDash([10, 5]);
      ctx.strokeStyle = 'yellow';
      ctx.lineWidth = 2;

      ctx.beginPath();
      const sp = pointToCanvas(lineup.start)
      const ep = pointToCanvas(lineup.end)
      ctx.moveTo(sp.x, sp.y);
      ctx.lineTo(ep.x, ep.y);
      ctx.stroke();
  }
}

function dis(x1, y1, x2, y2) {
  return Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2)
}

const openInNewTab = (url) => {
  window.open(url, '_blank', 'noopener,noreferrer');
};

const supabase = createClient();

export default function Home() {
  // 用户
  const [user, setUser] = useState(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => listener?.subscription.unsubscribe()
  }, [])

  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [windowSize, setWindowSize] = useState({
    width: 0,
    height: 0
  })

  useEffect(() => {
    const handleResize =  ()=>{
      console.log("size changed")
      setWindowSize(
        {
          width: window.width,
          height: window.height
        }
      )
    }
    window.addEventListener("resize", handleResize)

    return () => window.removeEventListener("resize", handleResize)

  }, [])


  const [maps, setMaps] = useState([]);

  const chosenMap = useSelectorStore((state) => state.chosenMap)  
  const choseMap = useSelectorStore((state) => state.choseMap)  

  console.log("chosen map is", chosenMap)

  const [heros, setHeros] = useState([]);
  const chosenHero = useSelectorStore((state) => state.chosenHero)  
  const choseHero = useSelectorStore((state) => state.choseHero)  

  const [state, setState] = useState(PAGE_SHOW); // show, add, upload

  const [lineups, setLineups] = useState([]);

  const [descs, setDescs] = useState([]);
  const [descIndex, setDescIndex] = useState(0);

  const chosenHeroItem = heros.find((elem) => {
    return elem.name === chosenHero
  })

  const chosenMapItem = maps.find((elem) => {
    return elem.name === chosenMap
  })
  const chosenMapUrl = chosenMapItem ? `${chosenMapItem.url}`: null;

  let skills = []
  if (chosenHeroItem) {
    skills = chosenHeroItem.skills 
  } 
  const chosenSkill = useSelectorStore((state) => state.chosenSkill)  
  const choseSkill = useSelectorStore((state) => state.choseSkill)  

  const mapRef = useRef(null);
  const mapImgRef = useRef(null);

  useEffect(()=> {
    async function fetchMaps() {
      try {
        const {data: maps} = await supabase.from('map').select("*")
        setMaps(maps)
      } catch(err) {
        console.log(err)
      }
    }

    async function fetchHeros() {
      try {
        const {data: heros} = await supabase.from('hero').select("*")
        setHeros(heros)
      } catch(err) {
        console.log(err)
      }
    }

    fetchMaps()
    fetchHeros()
  }, [])

  useEffect(()=> {
    async function getLineups(queryParam) {
      console.log("get lineups of  ", queryParam)
      const {data: lineups} = await supabase.rpc("getlineupby", {map_name: queryParam.map, hero_name: queryParam.hero, skill_name: queryParam.skill})
      setLineups(lineups);
    }

    getLineups({hero: chosenHero, map: chosenMap, skill: chosenSkill})
  }, [chosenHero, chosenMap, chosenSkill, loading])

  let handleCanvasClick;


  const [startPoint, setStartPoint] = useState(null)
  const [endPoint, setEndpoint] = useState(null)
  if (mapRef.current) { 
    const canvas = mapRef.current
    canvas.width = canvas.clientWidth
    canvas.height = canvas.clientHeight


    const img = mapImgRef.current
    const ctx = mapRef.current.getContext("2d")
    const cv = document.getElementById("map")
    console.log(`canvas width ${canvas.clientWidth} height ${canvas.clientHeight}`)
    console.log(`img width ${img.naturalWidth} height ${img.naturalHeight}`)

    const imgAspectRatio = img.naturalWidth / img.naturalHeight;
    const canvasAspectRatio = canvas.width / canvas.height;

    console.log(`img width ${img.clientWidth} height ${img.clientHeight}`)

    var transferPointBackToMap, transferPointToCanvas;

    // 获取节点映射函数
    if (imgAspectRatio > canvasAspectRatio) {
      const drawWidth = canvas.width;
      const drawHeight = canvas.width / imgAspectRatio;
      const scaleRatio = drawWidth / img.naturalWidth;
      const drawX=0
      const drawY = (canvas.height - drawHeight) / 2;
      transferPointToCanvas = (point) => {
          return {
              x: point.x * scaleRatio,
              y: point.y * scaleRatio + (canvas.height - drawHeight) / 2
          }
      }
      transferPointBackToMap = (point) => {
          return {
              x: point.x / scaleRatio,
              y: (point.y - (canvas.height - drawHeight) / 2) / scaleRatio
          }
      }
    } else {
        const drawWidth = canvas.height * imgAspectRatio;
        const drawHeight = canvas.height;
        const scaleRatio = drawHeight / img.naturalHeight;
        const drawX = (canvas.width - drawWidth) / 2;
        const drawY = 0;
        transferPointToCanvas = (point) => {
            return {
                x: point.x * scaleRatio + (canvas.width - drawWidth) / 2,
                y: point.y * scaleRatio
            }
        }
        transferPointBackToMap = (point) => {
            return {
                x: (point.x - (canvas.width - drawWidth) / 2) / scaleRatio,
                y: point.y / scaleRatio
            }
        }
    }
    console.log("lineups:", lineups)

    if (state === PAGE_SHOW) {
      handleCanvasClick = (event) => {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const clickedLineup = lineups.find(lineup => {
          const start = transferPointToCanvas(lineup.start)
          const end = transferPointToCanvas(lineup.end)

          return (dis(x, y, start.x, start.y) < Math.pow(RADIUS, 2) || dis(x, y, end.x, end.y) < Math.pow(RADIUS, 2)) 
        })

        if (clickedLineup) {
          console.log("clicked id", clickedLineup.id)
          router.push(`/lineups/${clickedLineup.id}`);
        }
      }
      clearAll(canvas)
      drawLineUps(canvas, lineups, transferPointToCanvas);
    }
    if (state === PAGE_ADD_0) {
      const startPoints = lineups.map(lineup => lineup.start)
      const endPoints = lineups.map(lineup => lineup.end)
      
      handleCanvasClick = (event) => {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const p = startPoints.find(point => {
          const p = transferPointToCanvas(point)
          return (dis(p.x, p.y, x, y) < Math.pow(RADIUS, 2))
        })
        if (p) {
          setStartPoint(p)
        } else {
          setStartPoint(transferPointBackToMap({x, y}))
        }
        setState(PAGE_ADD_1)
      }

      clearAll(canvas)
      drawPoints(canvas, startPoints, endPoints, transferPointToCanvas)
    }
    if (state === PAGE_ADD_1) {
      const startPoints = lineups.map(lineup => lineup.start)
      const endPoints = lineups.map(lineup => lineup.end)
      
      handleCanvasClick = (event) => {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const p = endPoints.find(point => {
          const p = transferPointToCanvas(point)
          return (dis(p.x, p.y, x, y) < Math.pow(RADIUS, 2))
        })
        if (p) {
          setEndpoint(p)
        } else {
          setEndpoint(transferPointBackToMap({x, y}))
        }
        setState(PAGE_ADD_2)
      }

      clearAll(canvas)
      drawPoints(canvas, [...startPoints, startPoint], endPoints, transferPointToCanvas)
    }
    if (state === PAGE_ADD_2) {
      const startPoints = lineups.map(lineup => lineup.start)
      const endPoints = lineups.map(lineup => lineup.end)
      
      clearAll(canvas)
      drawPoints(canvas, startPoints, endPoints, transferPointToCanvas)
      drawLineUp(canvas, {
        start: startPoint,
        end: endPoint,
      }, transferPointToCanvas)
    }
  }

  const addDesc = () => {
    console.log("descs ", descs)
    setDescs(
      [
        ...descs,
        {
          key: descIndex,
          text: "",
          image: undefined,
        }
      ]
    )
    setDescIndex(descIndex + 1)
  }

  const handlePaste = (event) => {
    var items = (event.clipboardData || windows.clipboardData).items;
    var file = null;
    if (items && items.length) {
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1)  {
                file = items[i].getAsFile();
                break;
            }
        }
    }

    console.log(file)
    if (file === null) {
      return 
    }

    const url = URL.createObjectURL(file);

    if (descs.length > 0) {
      const index = descs.length - 1;
      setDescs([
        ...descs.slice(0, index),
        {
          key: descs[index].key,
          text: descs[index].text,
          image: url,
          file: file
        }
      ])
    }

  }

  function finishSubmit() {
    setDescs([])
    setDescIndex(0)
    setState(PAGE_SHOW)
    setStartPoint(null)
    setEndpoint(null)
  }

  async function submit() {
    if (state !== PAGE_ADD_2 || descs.length === 0) {
      alert("lineup 未添加完！")
      return
    }

    let form = new FormData();
    const fileInputGroups = document.querySelectorAll('#descs .input-group');
    form.append("start", startPoint.x)
    form.append("start", startPoint.y)
    form.append("end", endPoint.x)
    form.append("end", endPoint.y)
    form.append('hero_id', chosenHeroItem.id)
    form.append('map_id', chosenMapItem.id)
    form.append('skill', chosenSkill)
    descs.forEach(desc => {
      if (!desc.file) {
        alert("存在图片未添加！")
        return
      }
      form.append("texts", desc.text)
      form.append("images", desc.file)
    })

    setLoading(true)
    try {
      const resp = await fetch('/api/lineups', {
          method: "POST",
          body: form,
      })

      if (!resp.ok) {
        throw new Error(resp.statusText)
      }

      alert("提交成功!")
      finishSubmit()
    } catch(err) {
      alert(`提交失败:${err}`)
      return
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex grow h-1 md:flex-row flex-col" onPaste={handlePaste}>
        <div className="basis-1/4 flex flex-col justify-center">
            <div className="flex flex-col items-center">
                <div className="mt-8 w-2/3">
                  <Select 
                    size="large"
                    placeholder="选择地图" 
                    className="w-full"
                    showSearch
                    value={chosenMap}
                    optionFilterProp="label"
                    onSelect={(key)=> {
                      choseMap(key)
                      
                    }}
                    options={maps.map(map=> {
                      return {
                        value: map.name,
                        label: map.name
                      }
                    })}
                    disabled={loading}
                  />
                </div>
                <div className="mt-8 w-2/3">
                  <Select 
                    size="large"
                    className="w-full" 
                    placeholder="选择英雄" 
                    showSearch
                    value={chosenHero}
                    optionFilterProp="label"
                    onSelect={(key)=> {
                      choseHero(key)
                      skills = heros.find((elem) => {
                        return elem.name === key
                      }).skills
                      choseSkill(skills[0])
                    }}
                    options={heros.map(hero=> {
                      return {
                        value: hero.name,
                        label: hero.name
                      }
                    })}
                    disabled={loading}
                  />
                </div>
                <div className="mt-8 w-2/3">
                  <Select 
                    size="large"
                    className="w-full" 
                    placeholder="选择技能" 
                    showSearch
                    optionFilterProp="label"
                    onSelect={(key)=> {
                      choseSkill(key)
                    }}
                    value={chosenSkill}
                    defaultValue={chosenSkill}
                    options={skills.map(skill=> {
                      return {
                        value: skill,
                        label: skill
                      }
                    })}
                    disabled={loading}
                  />
                </div>
            </div>
            <div className="md:flex flex-col items-center m-8 overflow-auto hidden">
              <Button size="large" hidden={state!==PAGE_SHOW || !user} className="mt-8" onClick={() => {
                setState(PAGE_ADD_0);
              }}>添加 lineup</Button>
              <p hidden={state!==PAGE_ADD_0}>点击图片添加 lineup 起点</p>
              <p hidden={state!==PAGE_ADD_1}>点击图片添加 lineup 终点</p>
              <div className="flex flex-col items-center">
                {
                  descs.map(desc=> {
                  return (
                    <div key={desc.key} className="flex flex-col items-center mt-4 border border-[#66ccff] rounded-lg p-4"> 
                      <Input  type="text" placeholder="添加描述文字" className="m-4" value={desc.text} onChange={(e) => {
                        console.log("文本修改: ", e.target.value)
                        setDescs(descs.map(d=> {
                          if (d.key === desc.key) {
                            return {
                              ...d,
                              text: e.target.value,
                            }
                          } else return d
                        }))
                      }}></Input>
                      <img src={desc.image} alt="粘贴以上传图片" className="w-[80%] m-4"/>
                      <DeleteOutlined onClick={()=> {
                        setDescs(descs.filter(item => item.key !== desc.key))
                      }}/> 
                    </div>)
                  })
                }
              

              </div>
              <Button hidden={state === PAGE_SHOW} size="large" className="mt-8" onClick={addDesc} disabled={loading}>添加图片及描述</Button>
              <div hidden={state === PAGE_SHOW} className="flex flex-row flex-wrap">
                <Button size="large" className="m-4" onClick={submit} disabled={loading}>
                  { loading? "上传中" : "提交"}
                </Button>
                <Button size="large" className="m-4" onClick={finishSubmit} disabled={loading}>取消</Button>
              </div>
            </div>
        </div>
        <div className="basis-3/4 relative">
            <img ref={mapImgRef} src={chosenMapUrl} className="z-0 object-contain h-full w-full absolute top-0 bottom-0"/>
            <canvas id="map" ref={mapRef} className="z-1 w-full h-full absolute top-0 bottom-0" onClick={handleCanvasClick}/>
        </div>
    </div>

  )

}

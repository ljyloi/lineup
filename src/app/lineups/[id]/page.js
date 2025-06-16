'use client'
import Image from "next/image"
import { use, useEffect, useState } from "react"
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

async function getLineupDetail(id) {
    console.log(id)
    try {
        console.log(`${API_BASE_URL}/lineups/${id}`)
        const res = await fetch(`${API_BASE_URL}/lineups/${id}`)
        if (res.status !== 200) {
            throw(new Error("获取 Lineup 失败"))
        }
        return res.json()
    } catch(err) {
        console.log(err)
        return
    }
}

export default function LineUp({
    params,
}) {
    const [descs, setDescs] = useState([])
    const {id} = use(params)

    useEffect(() => {
        const setFunc = async function () {
            const lineup = (await getLineupDetail(id))?.lineup
            if (lineup) {
                setDescs(lineup.descs)
            }
        }
        setFunc()
    }, [id])

    return (
        <div className="page lineup-w">
        <div className="lineup-header">
        </div>
        <div id="lineup-desc" >
            {
                descs.map((desc, index) => 
                <div key={index} className="flex flex-col items-center">
                    <p className="text-center text-2xl m-4">{desc.text}</p>
                    <img className="w-3/4" src={`data:image/png;base64,${desc.image}`}></img>
                </div>)
            }
        </div> 
        </div>
    )

}
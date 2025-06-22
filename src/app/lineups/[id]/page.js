'use client'
import { createClient } from "@/lib/client"
import Image from "next/image"
import { use, useEffect, useState } from "react"
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL


const supabase = createClient()
async function getLineupDetail(id) {
    const {data: lineup} = await supabase.from("lineup").select("*").eq("id", id)
    return lineup[0]
}

export default function LineUp({
    params,
}) {
    const [descs, setDescs] = useState([])
    const {id} = use(params)

    useEffect(() => {
        const setFunc = async function () {
            const lineup = await getLineupDetail(id)
            console.log(lineup)
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
                    <img className="w-3/4" src={`${desc.url}`}></img>
                </div>)
            }
        </div> 
        </div>
    )

}
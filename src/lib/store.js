// lib/store.js
'use client'; // 这里声明为客户端模块（如果你用的是纯模块系统）

import { create } from 'zustand';

const useSelectorStore = create((set) => ({
    chosenMap: "",
    chosenHero:  "",
    chosenSkill: "",

    choseHero: (hero) => set(() => ({chosenHero: hero})),
    choseMap: (map) => set(() => ({chosenMap: map})),
    choseSkill: (skill) => set(() => ({chosenSkill: skill}))
}))


export default useSelectorStore;

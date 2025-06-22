'use client'; // 如果在 app 目录下需要
import Link from 'next/link';
import { usePathname , useRouter} from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/client';
import {jwtDecode} from 'jwt-decode'


const links = [
  { name: '首页', href: '/' },
  // { name: '管理', href: '/manage' },
];

export default function NavigationBar() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const supabase = createClient();
  useEffect(() => {
    async function getUser() {
      const { data: {user} } = await supabase.auth.getUser()
      setUser(user)
    }

    getUser();

    const { data: listener } = supabase.auth.onAuthStateChange(async(_, session) => {
      if (session?.user) {
        console.log("user role ", jwtDecode(session.access_token).user_role)
        setTimeout(getUser)
      }
    });
    console.log(listener)
    return () => listener?.subscription.unsubscribe();
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut();
    console.log("logged out")
    setUser(null);
    router.push("/auth/login")
  }

  const pathname = usePathname();
  return (
    <nav className='h-20'>
      <div className='h-20 flex bg-[#66ccff] justify-between'>
        <div className='flex'>
          {links.map(link => (
            <div key={link.name} className={`rounded-md flex items-center ${pathname === link.href ? 'nav-link-active' : 'nav-link-inactive'}`}>
              <Link
                key={link.name}
                href={link.href}
                className={`text-center w-20 text-xl`}
              >
                {link.name}
              </Link>
            </div>
          ))}
        </div>
        <div className='<div className="flex items-center space-x-4">'>
          { user ? (
            <>
              <span>欢迎, {user.email}</span>
              <button onClick={handleLogout} className="px-4 py-1 rounded bg-blue-500 text-white hover:bg-blue-600 transition"> 登出 </button>
            </>

          ) : (
            <a href="/auth/login" className="px-4 py-1 rounded bg-blue-500 text-white hover:bg-blue-600 transition">登录/注册</a>)}
        </div>
      </div>
    </nav>
  );
}

'use client'; // 如果在 app 目录下需要
import Link from 'next/link';
import { usePathname } from 'next/navigation';


const links = [
  { name: '首页', href: '/' },
  { name: '管理', href: '/maps' },
];

export default function NavigationBar() {
  const pathname = usePathname();
  return (
    <nav className='h-20'>
      <div className='h-20 flex bg-[#66ccff]'>
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
    </nav>
  );
}

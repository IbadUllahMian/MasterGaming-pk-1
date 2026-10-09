import { HomePage } from '@/components/platform/Platform'; import { pageMetadata } from '@/data/seo';
import './home-gold.css';
export const metadata=pageMetadata('Free Fire Tournaments & Standings','Explore MasterGaming.pk Free Fire tournaments, team competition, published rules, and verified standings.','/'); export default function Page(){return <><div className="home-gold" hidden aria-hidden="true"/><HomePage/></>}

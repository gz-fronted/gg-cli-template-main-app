import MicroAppHost from '@/components/MicroAppHost';
import { reactMicroApp } from '@/micro-apps/bootstrap';

export default function MicroApp() {
  return <MicroAppHost definition={reactMicroApp} />;
}

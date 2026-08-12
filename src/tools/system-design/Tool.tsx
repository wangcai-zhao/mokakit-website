import ResourceList from '@/tools/_shared/ResourceList';
import { ITEMS, CATS } from './data';

export default function SystemDesign() {
  return <ResourceList items={ITEMS} cats={CATS} kindLabel="案例" placeholder="搜索主题，如 限流 / 缓存 / 支付…" />;
}

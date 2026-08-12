import ResourceList from '@/tools/_shared/ResourceList';
import { ITEMS, CATS } from './data';

export default function DevRoadmap() {
  return <ResourceList items={ITEMS} cats={CATS} kindLabel="节点" placeholder="搜索技能，如 React / Redis / K8s…" />;
}

import ResourceList from '@/tools/_shared/ResourceList';
import { ITEMS, CATS } from './data';

export default function PublicApis() {
  return <ResourceList items={ITEMS} cats={CATS} kindLabel="API" placeholder="搜索 API，如 weather / github…" />;
}

import ResourceList from '@/tools/_shared/ResourceList';
import { ITEMS, CATS } from './data';

export default function BuildYourOwnX() {
  return (
    <div>
      <ResourceList items={ITEMS} cats={CATS} kindLabel="项目" placeholder="搜索想造的东西，如 数据库 / 编译器…" />
    </div>
  );
}

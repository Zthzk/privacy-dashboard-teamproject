import {
  AppstoreOutlined,
  DatabaseOutlined,
  ProjectOutlined,
} from '@ant-design/icons'

const icons = {
  AppstoreOutlined,
  DatabaseOutlined,
  ProjectOutlined,
}

const dashboard = {
  id: 'group-dashboard',
  title: '',
  type: 'group',
  children: [
    {
      id: 'dashboard',
      title: 'Dashboard',
      type: 'item',
      url: '/dashboard',
      icon: icons.AppstoreOutlined,
      breadcrumbs: false,
    },
    {
      id: 'projects',
      title: 'Projects',
      type: 'item',
      url: '/projects',
      icon: icons.ProjectOutlined,
      breadcrumbs: false,
    },
    {
      id: 'data-sources',
      title: 'Data Sources',
      type: 'item',
      url: '/data-sources',
      icon: icons.DatabaseOutlined,
      breadcrumbs: false,
    },
  ],
}

export default dashboard

import { TelegramGroup } from '../types'

interface GroupListPageProps {
  onSelectGroup: (group: TelegramGroup) => void
}

export default function GroupListPage({ onSelectGroup }: GroupListPageProps) {
  return <div>Group List</div>
}

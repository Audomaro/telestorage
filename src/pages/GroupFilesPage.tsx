import { TelegramGroup } from '../types'

interface GroupFilesPageProps {
  group: TelegramGroup
  onBack: () => void
}

export default function GroupFilesPage({ group, onBack }: GroupFilesPageProps) {
  return <div>Group Files</div>
}

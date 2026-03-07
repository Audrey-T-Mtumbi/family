'use client'

import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card } from '@/components/ui/card'
import { format } from 'date-fns'

interface TreeMember {
  id: string
  first_name: string
  last_name: string | null
  birth_date: string | null
  death_date: string | null
  avatar_url: string | null
  bio: string | null
}

interface TreeMemberNodeData {
  member: TreeMember
  onEdit?: () => void
}

function TreeMemberNodeComponent({ data }: NodeProps) {
  const nodeData = data as TreeMemberNodeData
  const { member, onEdit } = nodeData

  const fullName = member.last_name
    ? `${member.first_name} ${member.last_name}`
    : member.first_name

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const formatDate = (date: string | null) => {
    if (!date) return null
    try {
      return format(new Date(date), 'yyyy')
    } catch {
      return null
    }
  }

  const birthYear = formatDate(member.birth_date)
  const deathYear = formatDate(member.death_date)
  const isDeceased = !!member.death_date

  return (
    <>
      {/* Connection Handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-primary !w-3 !h-3 !border-2 !border-background"
      />

      <Card
        className={`
          p-4 min-w-[140px] cursor-pointer 
          hover:shadow-lg transition-shadow
          ${isDeceased ? 'opacity-75' : ''}
          ${onEdit ? 'hover:ring-2 hover:ring-primary/50' : ''}
        `}
        onClick={onEdit}
      >
        <div className="flex flex-col items-center gap-2">
          <Avatar className="h-16 w-16 border-2 border-primary/20">
            <AvatarImage src={member.avatar_url || undefined} alt={fullName} />
            <AvatarFallback className="bg-primary/10 text-primary text-lg font-medium">
              {getInitials(fullName)}
            </AvatarFallback>
          </Avatar>

          <div className="text-center">
            <p className="font-medium text-sm leading-tight">{fullName}</p>
            {(birthYear || deathYear) && (
              <p className="text-xs text-muted-foreground mt-1">
                {birthYear || '?'}
                {isDeceased && ` - ${deathYear || '?'}`}
              </p>
            )}
          </div>
        </div>
      </Card>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-primary !w-3 !h-3 !border-2 !border-background"
      />
    </>
  )
}

export const TreeMemberNode = memo(TreeMemberNodeComponent)

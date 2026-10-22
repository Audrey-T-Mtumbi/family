'use client'

import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { format } from 'date-fns'

type Gender = 'male' | 'female' | 'other' | null

interface TreeMember {
  id: string
  first_name: string
  last_name: string | null
  birth_date: string | null
  death_date: string | null
  avatar_url: string | null
  bio: string | null
  gender?: Gender
}

interface TreeMemberNodeData {
  member: TreeMember
  onEdit?: () => void
}

const GENDER_STYLES = {
  male: {
    border: '#3b82f6',
    ring: '#bfdbfe',
    bg: 'linear-gradient(160deg, #eff6ff 0%, #dbeafe 100%)',
    avatarBg: '#93c5fd',
    avatarText: '#1d4ed8',
    accent: '#3b82f6',
    shadow: 'rgba(59,130,246,0.25)',
  },
  female: {
    border: '#ec4899',
    ring: '#fbcfe8',
    bg: 'linear-gradient(160deg, #fdf2f8 0%, #fce7f3 100%)',
    avatarBg: '#f9a8d4',
    avatarText: '#be185d',
    accent: '#ec4899',
    shadow: 'rgba(236,72,153,0.25)',
  },
  other: {
    border: '#8b5cf6',
    ring: '#ddd6fe',
    bg: 'linear-gradient(160deg, #f5f3ff 0%, #ede9fe 100%)',
    avatarBg: '#c4b5fd',
    avatarText: '#6d28d9',
    accent: '#8b5cf6',
    shadow: 'rgba(139,92,246,0.25)',
  },
  default: {
    border: '#4a7c59',
    ring: '#bbf7d0',
    bg: 'linear-gradient(160deg, #f0fdf4 0%, #dcfce7 100%)',
    avatarBg: '#86efac',
    avatarText: '#15803d',
    accent: '#4a7c59',
    shadow: 'rgba(74,124,89,0.25)',
  },
}

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

function formatYear(date: string | null) {
  if (!date) return null
  try { return format(new Date(date), 'yyyy') } catch { return null }
}

function TreeMemberNodeComponent({ data }: NodeProps) {
  const { member, onEdit } = data as TreeMemberNodeData

  const fullName = member.last_name
    ? `${member.first_name} ${member.last_name}`
    : member.first_name

  const birthYear = formatYear(member.birth_date)
  const deathYear = formatYear(member.death_date)
  const isDeceased = !!member.death_date
  const style = GENDER_STYLES[member.gender ?? 'default'] ?? GENDER_STYLES.default

  const parentHandleStyle = {
    background: '#4a7c59',
    width: 12, height: 12,
    border: '2.5px solid white',
    boxShadow: '0 0 0 2px #4a7c59',
  }

  const spouseHandleStyle = {
    background: '#c9a227',
    width: 12, height: 12,
    border: '2.5px solid white',
    boxShadow: '0 0 0 2px #c9a227',
  }

  return (
    <>
      <Handle type="target" position={Position.Top} id="top" style={{ ...parentHandleStyle, top: -6 }} />
      <Handle type="source" position={Position.Left} id="spouse-left" style={{ ...spouseHandleStyle, left: -6 }} />
      <Handle type="target" position={Position.Right} id="spouse-right" style={{ ...spouseHandleStyle, right: -6 }} />

      <div
        onClick={onEdit}
        style={{
          background: style.bg,
          border: `2.5px solid ${style.border}`,
          borderRadius: 20,
          width: 160,
          padding: '16px 12px 14px',
          cursor: onEdit ? 'pointer' : 'default',
          boxShadow: `0 8px 24px ${style.shadow}, 0 2px 8px rgba(0,0,0,0.06)`,
          opacity: isDeceased ? 0.8 : 1,
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 10,
          transition: 'transform 0.15s, box-shadow 0.15s',
        }}
        className={onEdit ? 'hover:scale-105' : ''}
      >
        {/* Top color band */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 6,
          background: style.border,
          borderRadius: '20px 20px 0 0',
        }} />

        {/* Deceased stripe */}
        {isDeceased && (
          <div style={{
            position: 'absolute', top: 6, left: 0, right: 0, height: 3,
            background: 'repeating-linear-gradient(90deg,#94a3b8 0,#94a3b8 5px,transparent 5px,transparent 10px)',
          }} />
        )}

        {/* Photo / Avatar */}
        <div style={{
          width: 72, height: 72,
          borderRadius: '50%',
          border: `3px solid ${style.border}`,
          boxShadow: `0 0 0 4px ${style.ring}, 0 4px 12px ${style.shadow}`,
          overflow: 'hidden',
          background: style.avatarBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 8,
          flexShrink: 0,
          position: 'relative',
        }}>
          {member.avatar_url ? (
            <img
              src={member.avatar_url}
              alt={fullName}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <span style={{
              fontSize: 22,
              fontWeight: 800,
              color: style.avatarText,
              fontFamily: 'Georgia, serif',
              letterSpacing: -1,
            }}>
              {getInitials(fullName)}
            </span>
          )}

          {/* Deceased badge */}
          {isDeceased && (
            <div style={{
              position: 'absolute', bottom: 0, right: 0,
              background: '#64748b',
              borderRadius: '50%',
              width: 18, height: 18,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, color: 'white',
              border: '2px solid white',
            }}>✝</div>
          )}
        </div>

        {/* Name */}
        <div style={{ textAlign: 'center', width: '100%' }}>
          <p style={{
            fontWeight: 700,
            fontSize: 13,
            lineHeight: 1.3,
            color: '#1e293b',
            fontFamily: 'Georgia, serif',
            marginBottom: 4,
            wordBreak: 'break-word',
          }}>
            {fullName}
          </p>

          {/* Dates */}
          {(birthYear || deathYear) && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 3,
              background: 'rgba(255,255,255,0.7)',
              borderRadius: 8,
              padding: '2px 8px',
              border: `1px solid ${style.border}30`,
            }}>
              <span style={{ fontSize: 10, color: '#475569', fontFamily: 'monospace', letterSpacing: 0.5 }}>
                {birthYear || '?'}
                {isDeceased ? ` – ${deathYear || '?'}` : ''}
              </span>
            </div>
          )}

          {/* Gender badge */}
          {member.gender && (
            <div style={{
              marginTop: 6,
              display: 'inline-block',
              fontSize: 9,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: 0.8,
              color: style.accent,
              background: `${style.border}15`,
              borderRadius: 6,
              padding: '1px 6px',
            }}>
              {member.gender}
            </div>
          )}
        </div>

        {/* Edit hint */}
        {onEdit && (
          <div style={{
            position: 'absolute',
            bottom: 6, right: 8,
            fontSize: 9,
            color: `${style.accent}80`,
            fontStyle: 'italic',
          }}>
            tap to edit
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} id="bottom" style={{ ...parentHandleStyle, bottom: -6 }} />
    </>
  )
}

export const TreeMemberNode = memo(TreeMemberNodeComponent)
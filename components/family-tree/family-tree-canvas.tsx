'use client'

import { useCallback, useMemo, useState } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  type Node,
  type Edge,
  type Connection,
  type NodeTypes,
  type EdgeTypes,
  Panel,
  EdgeLabelRenderer,
  getStraightPath,
  getBezierPath,
  useReactFlow,
} from '@xyflow/react'
// @ts-ignore
import '@xyflow/react/dist/style.css'
import { db } from '@/lib/firebase'
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, getDocs } from 'firebase/firestore'
import { Button } from '@/components/ui/button'
import { Plus, ArrowLeft, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { TreeMemberNode } from './tree-member-node'
import { AddMemberDialog } from './add-member-dialog'
import { EditMemberDialog } from './edit-member-dialog'

type Gender = 'male' | 'female' | 'other' | null

interface TreeMember {
  id: string
  family_id: string
  first_name: string
  last_name: string | null
  birth_date: string | null
  death_date: string | null
  avatar_url: string | null
  bio: string | null
  position_x: number
  position_y: number
  linked_user_id: string | null
  gender?: Gender
}

interface TreeRelationship {
  id: string
  family_id: string
  from_member_id: string
  to_member_id: string
  relationship_type: 'parent' | 'spouse'
}

interface FamilyTreeCanvasProps {
  familyId: string
  familyName: string
  initialMembers: TreeMember[]
  initialRelationships: TreeRelationship[]
  canEdit: boolean
}

function SpouseEdge({ sourceX, sourceY, targetX, targetY }: any) {
  const [edgePath, labelX, labelY] = getStraightPath({ sourceX, sourceY, targetX, targetY })
  return (
    <>
      <path d={edgePath} fill="none" stroke="#f9d77e" strokeWidth={8} strokeLinecap="round" />
      <path d={edgePath} fill="none" stroke="#c9a227" strokeWidth={3} strokeLinecap="round" strokeDasharray="6 3" />
      <EdgeLabelRenderer>
        <div style={{ position: 'absolute', transform: `translate(-50%,-50%) translate(${labelX}px,${labelY}px)`, pointerEvents: 'none', fontSize: 13, background: 'white', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #c9a227', boxShadow: '0 2px 6px rgba(201,162,39,0.3)' }} className="nodrag nopan">💍</div>
      </EdgeLabelRenderer>
    </>
  )
}

function ParentEdge({ sourceX, sourceY, targetX, targetY, markerEnd }: any) {
  const [edgePath] = getBezierPath({ sourceX, sourceY, sourcePosition: 'bottom' as any, targetX, targetY, targetPosition: 'top' as any, curvature: 0.25 })
  return (
    <>
      <path d={edgePath} fill="none" stroke="#86efac" strokeWidth={5} strokeLinecap="round" opacity={0.35} />
      <path d={edgePath} fill="none" stroke="#4a7c59" strokeWidth={2.5} strokeLinecap="round" markerEnd={markerEnd} />
    </>
  )
}

const nodeTypes: NodeTypes = { treeMember: TreeMemberNode }
const edgeTypes: EdgeTypes = { spouseEdge: SpouseEdge, parentEdge: ParentEdge }

function Legend() {
  return (
    <div style={{ background: 'rgba(253,246,227,0.97)', border: '1px solid rgba(139,105,20,0.2)', borderRadius: 12, padding: '10px 14px', boxShadow: '0 4px 16px rgba(44,24,16,0.08)', display: 'flex', flexDirection: 'column', gap: 8, minWidth: 190 }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: '#8B6914', textTransform: 'uppercase', letterSpacing: 1 }}>Legend</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <div style={{ width: 22, height: 3, background: 'repeating-linear-gradient(90deg,#c9a227 0px,#c9a227 4px,transparent 4px,transparent 7px)', borderRadius: 2 }} />
          <span style={{ fontSize: 11 }}>💍</span>
          <div style={{ width: 22, height: 3, background: 'repeating-linear-gradient(90deg,#c9a227 0px,#c9a227 4px,transparent 4px,transparent 7px)', borderRadius: 2 }} />
        </div>
        <span style={{ fontSize: 12, color: '#4b3a2a' }}>Married / Couple</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <div style={{ width: 36, height: 3, background: '#4a7c59', borderRadius: 2 }} />
          <div style={{ width: 0, height: 0, borderTop: '5px solid transparent', borderBottom: '5px solid transparent', borderLeft: '7px solid #4a7c59' }} />
        </div>
        <span style={{ fontSize: 12, color: '#4b3a2a' }}>Parent → Child</span>
      </div>
      <div style={{ borderTop: '1px solid rgba(139,105,20,0.15)', paddingTop: 6 }}>
        <p style={{ fontSize: 10, color: '#8B6914', fontWeight: 600, marginBottom: 4 }}>CONNECTING MEMBERS</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#c9a227', border: '2px solid white', flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: '#4b3a2a' }}>Side handles → Spouse</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#4a7c59', border: '2px solid white', flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: '#4b3a2a' }}>Top/bottom → Parent/Child</span>
        </div>
      </div>
      <div style={{ borderTop: '1px solid rgba(139,105,20,0.15)', paddingTop: 6 }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: '#8B6914', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>Node Colours</p>
        {[{ color: '#3b82f6', label: 'Male' }, { color: '#ec4899', label: 'Female' }, { color: '#8b5cf6', label: 'Other' }, { color: '#4a7c59', label: 'Unspecified' }].map(({ color, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, background: color, flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: '#4b3a2a' }}>{label}</span>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, borderTop: '1px solid rgba(139,105,20,0.15)', paddingTop: 6 }}>
        <span style={{ fontSize: 13 }}>✝</span>
        <span style={{ fontSize: 11, color: '#4b3a2a' }}>Deceased member</span>
      </div>
    </div>
  )
}

function computeSmartLayout(nodes: Node[], edges: Edge[]): Node[] {
  const NODE_W = 180
  const NODE_H = 180
  const H_GAP = 80
  const V_GAP = 140
  const SPOUSE_GAP = 10

  if (nodes.length === 0) return nodes

  const childrenOf: Record<string, string[]> = {}
  const parentsOf: Record<string, string[]> = {}
  const spouseOf: Record<string, string> = {}

  edges.forEach((e) => {
    if (e.type === 'spouseEdge') {
      spouseOf[e.source] = e.target
      spouseOf[e.target] = e.source
    }
    if (e.type === 'parentEdge') {
      if (!childrenOf[e.source]) childrenOf[e.source] = []
      childrenOf[e.source].push(e.target)
      if (!parentsOf[e.target]) parentsOf[e.target] = []
      parentsOf[e.target].push(e.source)
    }
  })

  const allIds = nodes.map((n) => n.id)
  const roots = allIds.filter((id) => !parentsOf[id] || parentsOf[id].length === 0)
  if (roots.length === 0) roots.push(allIds[0])

  const depth: Record<string, number> = {}
  const bfsQueue = [...roots]
  roots.forEach((r) => { depth[r] = 0 })

  while (bfsQueue.length > 0) {
    const curr = bfsQueue.shift()!
    const d = depth[curr]
    const spouse = spouseOf[curr]
    if (spouse && depth[spouse] === undefined) {
      depth[spouse] = d
      bfsQueue.push(spouse)
    }
    ;(childrenOf[curr] || []).forEach((child) => {
      if (depth[child] === undefined) {
        depth[child] = d + 1
        bfsQueue.push(child)
      }
    })
  }

  allIds.forEach((id) => { if (depth[id] === undefined) depth[id] = 0 })

  const levels: Record<number, string[]> = {}
  const placed = new Set<string>()
  const maxDepth = Math.max(...allIds.map((id) => depth[id]))

  for (let d = 0; d <= maxDepth; d++) {
    if (!levels[d]) levels[d] = []
    const levelIds = allIds.filter((id) => depth[id] === d && !placed.has(id))
    levelIds.forEach((id) => {
      if (placed.has(id)) return
      const spouse = spouseOf[id]
      if (spouse && !placed.has(spouse) && depth[spouse] === d) {
        levels[d].push(id, spouse)
        placed.add(id)
        placed.add(spouse)
      } else {
        levels[d].push(id)
        placed.add(id)
      }
    })
  }

  const positions: Record<string, { x: number; y: number }> = {}

  for (let d = 0; d <= maxDepth; d++) {
    const members = levels[d] || []
    if (members.length === 0) continue
    let totalW = 0
    for (let i = 0; i < members.length; i++) {
      const isSpousePair = i > 0 && spouseOf[members[i - 1]] === members[i]
      totalW += NODE_W + (i > 0 ? (isSpousePair ? SPOUSE_GAP : H_GAP) : 0)
    }
    let x = -totalW / 2
    members.forEach((id, i) => {
      const isSpousePair = i > 0 && spouseOf[members[i - 1]] === members[i]
      if (i > 0) x += isSpousePair ? SPOUSE_GAP : H_GAP
      positions[id] = { x, y: d * (NODE_H + V_GAP) }
      x += NODE_W
    })
  }

  for (let d = maxDepth - 1; d >= 0; d--) {
    const members = levels[d] || []
    members.forEach((id) => {
      const spouse = spouseOf[id]
      const allChildren = [...new Set([...(childrenOf[id] || []), ...(spouse ? childrenOf[spouse] || [] : [])])]
      if (allChildren.length > 0 && positions[allChildren[0]]) {
        const childXs = allChildren.map((c) => positions[c]?.x || 0)
        const centerX = (Math.min(...childXs) + Math.max(...childXs) + NODE_W) / 2
        if (spouse && positions[spouse]) {
          positions[id].x = centerX - NODE_W - SPOUSE_GAP / 2
          positions[spouse].x = centerX + SPOUSE_GAP / 2
        } else {
          positions[id].x = centerX - NODE_W / 2
        }
      }
    })
  }

  return nodes.map((n) => ({ ...n, position: positions[n.id] ?? n.position }))
}

function DemoTree() {
  const demoNodes: Node[] = [
    { id: 'd1', type: 'treeMember', position: { x: 280, y: 40 }, data: { member: { id: 'd1', family_id: '', first_name: 'George', last_name: 'Family', birth_date: '1945-01-01', death_date: null, avatar_url: null, bio: null, gender: 'male', position_x: 280, position_y: 40, linked_user_id: null } } },
    { id: 'd2', type: 'treeMember', position: { x: 500, y: 40 }, data: { member: { id: 'd2', family_id: '', first_name: 'Mary', last_name: 'Family', birth_date: '1948-01-01', death_date: null, avatar_url: null, bio: null, gender: 'female', position_x: 500, position_y: 40, linked_user_id: null } } },
    { id: 'd3', type: 'treeMember', position: { x: 100, y: 280 }, data: { member: { id: 'd3', family_id: '', first_name: 'James', last_name: 'Family', birth_date: '1970-01-01', death_date: null, avatar_url: null, bio: null, gender: 'male', position_x: 100, position_y: 280, linked_user_id: null } } },
    { id: 'd4', type: 'treeMember', position: { x: 320, y: 280 }, data: { member: { id: 'd4', family_id: '', first_name: 'Sarah', last_name: 'Family', birth_date: '1972-01-01', death_date: null, avatar_url: null, bio: null, gender: 'female', position_x: 320, position_y: 280, linked_user_id: null } } },
    { id: 'd5', type: 'treeMember', position: { x: 560, y: 280 }, data: { member: { id: 'd5', family_id: '', first_name: 'Peter', last_name: 'Family', birth_date: '1975-01-01', death_date: null, avatar_url: null, bio: null, gender: 'male', position_x: 560, position_y: 280, linked_user_id: null } } },
    { id: 'd6', type: 'treeMember', position: { x: 100, y: 520 }, data: { member: { id: 'd6', family_id: '', first_name: 'Emma', last_name: '', birth_date: '2000-01-01', death_date: null, avatar_url: null, bio: null, gender: 'female', position_x: 100, position_y: 520, linked_user_id: null } } },
    { id: 'd7', type: 'treeMember', position: { x: 320, y: 520 }, data: { member: { id: 'd7', family_id: '', first_name: 'Liam', last_name: '', birth_date: '2003-01-01', death_date: null, avatar_url: null, bio: null, gender: 'male', position_x: 320, position_y: 520, linked_user_id: null } } },
    { id: 'd8', type: 'treeMember', position: { x: 560, y: 520 }, data: { member: { id: 'd8', family_id: '', first_name: 'Zoe', last_name: '', birth_date: '2005-01-01', death_date: null, avatar_url: null, bio: null, gender: 'female', position_x: 560, position_y: 520, linked_user_id: null } } },
  ]
  const demoEdges: Edge[] = [
    { id: 'de1', source: 'd1', target: 'd2', type: 'spouseEdge', sourceHandle: 'spouse-left', targetHandle: 'spouse-right', animated: true },
    { id: 'de2', source: 'd1', target: 'd3', type: 'parentEdge', sourceHandle: 'bottom', targetHandle: 'top', markerEnd: { type: 'arrowclosed' as any, color: '#4a7c59', width: 18, height: 18 } },
    { id: 'de3', source: 'd2', target: 'd5', type: 'parentEdge', sourceHandle: 'bottom', targetHandle: 'top', markerEnd: { type: 'arrowclosed' as any, color: '#4a7c59', width: 18, height: 18 } },
    { id: 'de4', source: 'd3', target: 'd4', type: 'spouseEdge', sourceHandle: 'spouse-left', targetHandle: 'spouse-right', animated: true },
    { id: 'de5', source: 'd3', target: 'd6', type: 'parentEdge', sourceHandle: 'bottom', targetHandle: 'top', markerEnd: { type: 'arrowclosed' as any, color: '#4a7c59', width: 18, height: 18 } },
    { id: 'de6', source: 'd4', target: 'd7', type: 'parentEdge', sourceHandle: 'bottom', targetHandle: 'top', markerEnd: { type: 'arrowclosed' as any, color: '#4a7c59', width: 18, height: 18 } },
    { id: 'de7', source: 'd5', target: 'd8', type: 'parentEdge', sourceHandle: 'bottom', targetHandle: 'top', markerEnd: { type: 'arrowclosed' as any, color: '#4a7c59', width: 18, height: 18 } },
  ]
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.25, zIndex: 0 }}>
      <ReactFlow nodes={demoNodes} edges={demoEdges} nodeTypes={nodeTypes} edgeTypes={edgeTypes} fitView fitViewOptions={{ padding: 0.15 }} proOptions={{ hideAttribution: true }} nodesDraggable={false} nodesConnectable={false} elementsSelectable={false} zoomOnScroll={false} panOnDrag={false}>
        <Background color="#c9a227" gap={24} size={0.5} />
      </ReactFlow>
    </div>
  )
}

function AutoLayoutButton({ nodes, edges, setNodes, setEdges, familyId, canEdit }: any) {
  const { fitView } = useReactFlow()
  const [loading, setLoading] = useState(false)

  const handleAutoLayout = async () => {
    setLoading(true)
    const laid = computeSmartLayout(nodes, edges)
    setNodes(laid)
    if (canEdit) {
      await Promise.all(laid.map((n: Node) =>
        updateDoc(doc(db, 'families', familyId, 'treeMembers', n.id), {
          position_x: Math.round(n.position.x),
          position_y: Math.round(n.position.y),
        }).catch(() => {})
      ))
    }
    setTimeout(() => { fitView({ padding: 0.25, duration: 800 }); setLoading(false) }, 150)
  }

  const handleClearConnections = async () => {
    if (!confirm('Clear all connections? You can redraw them.')) return
    const snap = await getDocs(collection(db, 'families', familyId, 'relationships'))
    await Promise.all(snap.docs.map(d => deleteDoc(doc(db, 'families', familyId, 'relationships', d.id))))
    setEdges([])
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
      <Button onClick={handleAutoLayout} disabled={loading} size="sm" style={{ background: 'linear-gradient(135deg, #c9a227, #8B6914)', border: 'none' }}>
        <Sparkles className="h-4 w-4 mr-2" />
        {loading ? 'Arranging...' : 'Auto Layout'}
      </Button>
      {canEdit && (
        <Button onClick={handleClearConnections} size="sm" style={{ background: 'rgba(184,92,56,0.85)', border: 'none', fontSize: 11 }}>
          🗑️ Clear Connections
        </Button>
      )}
    </div>
  )
}

export function FamilyTreeCanvas({ familyId, familyName, initialMembers, initialRelationships, canEdit }: FamilyTreeCanvasProps) {
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<TreeMember | null>(null)
  const [showLegend, setShowLegend] = useState(true)

  const initialNodes: Node[] = useMemo(
    () => initialMembers.map((member) => ({
      id: member.id, type: 'treeMember',
      position: { x: member.position_x, y: member.position_y },
      data: { member, onEdit: canEdit ? () => setEditingMember(member) : undefined },
    })),
    [initialMembers, canEdit]
  )

  const initialEdges: Edge[] = useMemo(
    () => initialRelationships.map((rel) => ({
      id: rel.id, source: rel.from_member_id, target: rel.to_member_id,
      type: rel.relationship_type === 'spouse' ? 'spouseEdge' : 'parentEdge',
      sourceHandle: rel.relationship_type === 'spouse' ? 'spouse-left' : 'bottom',
      targetHandle: rel.relationship_type === 'spouse' ? 'spouse-right' : 'top',
      markerEnd: rel.relationship_type === 'parent' ? { type: 'arrowclosed' as any, color: '#4a7c59', width: 18, height: 18 } : undefined,
      animated: rel.relationship_type === 'spouse',
    })),
    [initialRelationships]
  )

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  const onConnect = useCallback(async (connection: Connection) => {
    if (!canEdit) return
    const tempId = `temp-${Date.now()}`
    const isSpouse = connection.sourceHandle === 'spouse-left' || connection.sourceHandle === 'spouse-right'
    const newEdge: Edge = { 
      id: tempId, 
      source: connection.source!, 
      target: connection.target!, 
      type: isSpouse ? 'spouseEdge' : 'parentEdge',
      sourceHandle: connection.sourceHandle,
      targetHandle: connection.targetHandle,
      animated: isSpouse,
      markerEnd: isSpouse ? undefined : { type: 'arrowclosed' as any, color: '#4a7c59', width: 18, height: 18 }
    }
    setEdges((eds) => addEdge(newEdge, eds))
    const ref = await addDoc(collection(db, 'families', familyId, 'relationships'), {
      from_member_id: connection.source, 
      to_member_id: connection.target, 
      relationship_type: isSpouse ? 'spouse' : 'parent', 
      createdAt: serverTimestamp(),
    })
    setEdges((eds) => eds.map((e) => (e.id === tempId ? { ...e, id: ref.id } : e)))
  }, [canEdit, familyId, setEdges])
  const onNodeDragStop = useCallback(async (_: React.MouseEvent, node: Node) => {
    if (!canEdit) return
    await updateDoc(doc(db, 'families', familyId, 'treeMembers', node.id), {
      position_x: Math.round(node.position.x), position_y: Math.round(node.position.y),
    })
  }, [canEdit, familyId])

  const handleAddMember = async (data: { firstName: string; lastName: string; birthDate: string | null; deathDate: string | null; bio: string | null; gender: Gender; avatarUrl: string | null }) => {
    const position = { x: 100 + Math.random() * 400, y: 100 + Math.random() * 300 }
    const newMemberRef = await addDoc(collection(db, 'families', familyId, 'treeMembers'), {
      family_id: familyId, first_name: data.firstName, last_name: data.lastName || null,
      birth_date: data.birthDate || null, death_date: data.deathDate || null,
      bio: data.bio || null, gender: data.gender || null, avatar_url: data.avatarUrl || null,
      linked_user_id: null, position_x: Math.round(position.x), position_y: Math.round(position.y), createdAt: serverTimestamp(),
    })
    const newMember: TreeMember = {
      id: newMemberRef.id, family_id: familyId, first_name: data.firstName, last_name: data.lastName || null,
      birth_date: data.birthDate || null, death_date: data.deathDate || null, bio: data.bio || null,
      gender: data.gender || null, avatar_url: data.avatarUrl || null, linked_user_id: null,
      position_x: Math.round(position.x), position_y: Math.round(position.y),
    }
    setNodes((nds) => [...nds, { id: newMemberRef.id, type: 'treeMember', position, data: { member: newMember, onEdit: canEdit ? () => setEditingMember(newMember) : undefined } }])
    setAddDialogOpen(false)
  }

  const handleEditMember = async (data: { firstName: string; lastName: string; birthDate: string | null; deathDate: string | null; bio: string | null; gender: Gender }) => {
    if (!editingMember) return
    await updateDoc(doc(db, 'families', familyId, 'treeMembers', editingMember.id), {
      first_name: data.firstName, last_name: data.lastName || null, birth_date: data.birthDate || null,
      death_date: data.deathDate || null, bio: data.bio || null, gender: data.gender || null,
    })
    const updatedMember = { ...editingMember, first_name: data.firstName, last_name: data.lastName || null, birth_date: data.birthDate || null, death_date: data.deathDate || null, bio: data.bio || null, gender: data.gender || null }
    setNodes((nds) => nds.map((node) => node.id === editingMember.id ? { ...node, data: { ...node.data, member: updatedMember } } : node))
    setEditingMember(null)
  }

  const handleDeleteMember = async () => {
    if (!editingMember) return
    await deleteDoc(doc(db, 'families', familyId, 'treeMembers', editingMember.id))
    setNodes((nds) => nds.filter((n) => n.id !== editingMember.id))
    setEdges((eds) => eds.filter((e) => e.source !== editingMember.id && e.target !== editingMember.id))
    setEditingMember(null)
  }

  const isEmpty = nodes.length === 0

  return (
    <div className="w-full h-full relative">
      {isEmpty && <DemoTree />}
      <ReactFlow
        nodes={nodes} edges={edges}
        onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
        onConnect={onConnect} onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes} edgeTypes={edgeTypes}
        fitView fitViewOptions={{ padding: 0.2 }}
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{ type: 'parentEdge' }}
        style={{ background: isEmpty ? 'transparent' : undefined }}
      >
        {!isEmpty && <Background color="#c9a227" gap={24} size={0.5} />}
        <Controls className="bg-card border rounded-lg" />
        {!isEmpty && (
          <MiniMap className="bg-card border rounded-lg"
            nodeColor={(node) => {
              const g = (node.data as any)?.member?.gender
              if (g === 'male') return '#3b82f6'
              if (g === 'female') return '#ec4899'
              if (g === 'other') return '#8b5cf6'
              return '#4a7c59'
            }}
            maskColor="rgba(253,246,227,0.5)"
          />
        )}
        <Panel position="top-left" className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild style={{ borderColor: 'rgba(139,105,20,0.3)', color: '#6b5a47' }}>
            <Link href={`/dashboard/family/${familyId}`}><ArrowLeft className="h-4 w-4 mr-2" />Back</Link>
          </Button>
          <h1 className="text-lg font-serif font-semibold px-3 py-1.5 rounded-lg" style={{ background: 'rgba(253,246,227,0.9)', color: '#2c1810', border: '1px solid rgba(139,105,20,0.2)' }}>
            🌳 {familyName} Family Tree
          </h1>
        </Panel>
        <Panel position="top-right" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
          {canEdit && (
            <Button onClick={() => setAddDialogOpen(true)} style={{ background: 'linear-gradient(135deg, #4a7c59, #2d5a3d)', border: 'none' }}>
              <Plus className="h-4 w-4 mr-2" />Add Member
            </Button>
          )}
          {!isEmpty && <AutoLayoutButton nodes={nodes} edges={edges} setNodes={setNodes} setEdges={setEdges} familyId={familyId} canEdit={canEdit} />}
          <button onClick={() => setShowLegend((v) => !v)} style={{ fontSize: 11, color: '#8B6914', background: 'rgba(253,246,227,0.9)', border: '1px solid rgba(139,105,20,0.2)', borderRadius: 8, padding: '4px 10px', cursor: 'pointer' }}>
            {showLegend ? 'Hide Legend' : 'Show Legend'}
          </button>
        </Panel>
        {showLegend && !isEmpty && <Panel position="bottom-left"><Legend /></Panel>}
        {isEmpty && (
          <Panel position="bottom-center">
            <div className="rounded-2xl p-8 text-center max-w-lg" style={{ background: 'rgba(253,246,227,0.97)', border: '1px solid rgba(139,105,20,0.2)', boxShadow: '0 8px 32px rgba(44,24,16,0.12)' }}>
              <div className="text-4xl mb-3">🌳</div>
              <h3 className="font-serif font-bold text-xl mb-2" style={{ color: '#2c1810' }}>Start Your Family Tree</h3>
              <p className="text-sm mb-2" style={{ color: '#6b5a47' }}>The tree behind shows you what yours will look like. Add your first member to begin!</p>
              <p className="text-xs mb-5" style={{ color: '#8B6914' }}>💍 Connect <strong>side handles</strong> for couples &nbsp;·&nbsp; 🌿 Connect <strong>top/bottom</strong> for parent → child</p>
              {canEdit && (
                <Button onClick={() => setAddDialogOpen(true)} style={{ background: 'linear-gradient(135deg, #4a7c59, #2d5a3d)', border: 'none', padding: '10px 24px' }}>
                  <Plus className="h-4 w-4 mr-2" />Add Your First Member
                </Button>
              )}
            </div>
          </Panel>
        )}
      </ReactFlow>
      <AddMemberDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} onSubmit={handleAddMember} />
      <EditMemberDialog open={!!editingMember} onOpenChange={(open) => !open && setEditingMember(null)} member={editingMember} onSubmit={handleEditMember} onDelete={handleDeleteMember} />
    </div>
  )
}
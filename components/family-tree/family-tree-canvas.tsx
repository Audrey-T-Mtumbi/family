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
  Panel,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Plus, ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'
import { TreeMemberNode } from './tree-member-node'
import { AddMemberDialog } from './add-member-dialog'
import { EditMemberDialog } from './edit-member-dialog'

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

const nodeTypes: NodeTypes = {
  treeMember: TreeMemberNode,
}

export function FamilyTreeCanvas({
  familyId,
  familyName,
  initialMembers,
  initialRelationships,
  canEdit,
}: FamilyTreeCanvasProps) {
  const supabase = createClient()
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<TreeMember | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Convert tree members to React Flow nodes
  const initialNodes: Node[] = useMemo(
    () =>
      initialMembers.map((member) => ({
        id: member.id,
        type: 'treeMember',
        position: { x: member.position_x, y: member.position_y },
        data: {
          member,
          onEdit: canEdit ? () => setEditingMember(member) : undefined,
        },
      })),
    [initialMembers, canEdit]
  )

  // Convert relationships to React Flow edges
  const initialEdges: Edge[] = useMemo(
    () =>
      initialRelationships.map((rel) => ({
        id: rel.id,
        source: rel.from_member_id,
        target: rel.to_member_id,
        type: rel.relationship_type === 'spouse' ? 'straight' : 'smoothstep',
        style: {
          stroke: rel.relationship_type === 'spouse' ? 'var(--accent)' : 'var(--primary)',
          strokeWidth: 2,
          strokeDasharray: rel.relationship_type === 'spouse' ? '5,5' : undefined,
        },
        animated: false,
      })),
    [initialRelationships]
  )

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  const onConnect = useCallback(
    (connection: Connection) => {
      if (!canEdit) return
      setEdges((eds) =>
        addEdge(
          {
            ...connection,
            type: 'smoothstep',
            style: { stroke: 'var(--primary)', strokeWidth: 2 },
          },
          eds
        )
      )
      setHasUnsavedChanges(true)
    },
    [canEdit, setEdges]
  )

  const onNodeDragStop = useCallback(
    async (_: React.MouseEvent, node: Node) => {
      if (!canEdit) return
      setHasUnsavedChanges(true)
      
      // Update position in database
      await supabase
        .from('tree_members')
        .update({
          position_x: Math.round(node.position.x),
          position_y: Math.round(node.position.y),
        })
        .eq('id', node.id)
    },
    [canEdit, supabase]
  )

  const handleAddMember = async (data: {
    firstName: string
    lastName: string
    birthDate: string | null
    deathDate: string | null
    bio: string | null
  }) => {
    const { data: newMember, error } = await supabase
      .from('tree_members')
      .insert({
        family_id: familyId,
        first_name: data.firstName,
        last_name: data.lastName || null,
        birth_date: data.birthDate || null,
        death_date: data.deathDate || null,
        bio: data.bio || null,
        position_x: 100 + Math.random() * 400,
        position_y: 100 + Math.random() * 300,
      })
      .select()
      .single()

    if (!error && newMember) {
      const newNode: Node = {
        id: newMember.id,
        type: 'treeMember',
        position: { x: newMember.position_x, y: newMember.position_y },
        data: {
          member: newMember,
          onEdit: canEdit ? () => setEditingMember(newMember) : undefined,
        },
      }
      setNodes((nds) => [...nds, newNode])
    }

    setAddDialogOpen(false)
  }

  const handleEditMember = async (data: {
    firstName: string
    lastName: string
    birthDate: string | null
    deathDate: string | null
    bio: string | null
  }) => {
    if (!editingMember) return

    const { error } = await supabase
      .from('tree_members')
      .update({
        first_name: data.firstName,
        last_name: data.lastName || null,
        birth_date: data.birthDate || null,
        death_date: data.deathDate || null,
        bio: data.bio || null,
      })
      .eq('id', editingMember.id)

    if (!error) {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === editingMember.id
            ? {
                ...node,
                data: {
                  ...node.data,
                  member: {
                    ...editingMember,
                    first_name: data.firstName,
                    last_name: data.lastName || null,
                    birth_date: data.birthDate || null,
                    death_date: data.deathDate || null,
                    bio: data.bio || null,
                  },
                },
              }
            : node
        )
      )
    }

    setEditingMember(null)
  }

  const handleDeleteMember = async () => {
    if (!editingMember) return

    const { error } = await supabase
      .from('tree_members')
      .delete()
      .eq('id', editingMember.id)

    if (!error) {
      setNodes((nds) => nds.filter((node) => node.id !== editingMember.id))
      setEdges((eds) =>
        eds.filter(
          (edge) =>
            edge.source !== editingMember.id && edge.target !== editingMember.id
        )
      )
    }

    setEditingMember(null)
  }

  return (
    <div className="w-full h-full relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        className="bg-background"
        proOptions={{ hideAttribution: true }}
      >
        <Background color="var(--border)" gap={20} />
        <Controls className="bg-card border rounded-lg" />
        <MiniMap
          className="bg-card border rounded-lg"
          nodeColor="var(--primary)"
          maskColor="rgba(0, 0, 0, 0.1)"
        />

        {/* Header Panel */}
        <Panel position="top-left" className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/family/${familyId}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
          <h1 className="text-lg font-serif font-semibold bg-card/80 backdrop-blur-sm px-3 py-1.5 rounded-lg">
            {familyName} Family Tree
          </h1>
        </Panel>

        {/* Action Panel */}
        {canEdit && (
          <Panel position="top-right" className="flex items-center gap-2">
            <Button onClick={() => setAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Member
            </Button>
          </Panel>
        )}

        {/* Instructions Panel */}
        {nodes.length === 0 && (
          <Panel position="bottom-center">
            <div className="bg-card border rounded-lg p-6 text-center max-w-md">
              <h3 className="font-serif font-semibold mb-2">Your Tree is Empty</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Start building your family tree by adding family members. You can drag them around and connect relationships.
              </p>
              {canEdit && (
                <Button onClick={() => setAddDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Member
                </Button>
              )}
            </div>
          </Panel>
        )}
      </ReactFlow>

      {/* Dialogs */}
      <AddMemberDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSubmit={handleAddMember}
      />

      <EditMemberDialog
        open={!!editingMember}
        onOpenChange={(open) => !open && setEditingMember(null)}
        member={editingMember}
        onSubmit={handleEditMember}
        onDelete={handleDeleteMember}
      />
    </div>
  )
}

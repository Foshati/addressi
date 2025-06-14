'use client';

import { useState, useEffect } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis, restrictToWindowEdges } from '@dnd-kit/modifiers';

import { SocialLink, deleteSocialLink, reorderSocialLinks } from '@/lib/api-treeLink';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { GripVertical, PlusCircle, Trash2, Edit } from 'lucide-react';
import SocialLinkForm from './SocialLinkForm';

interface SocialLinksListProps {
  socialLinks: SocialLink[];
}

// Sortable Item Component
function SortableSocialLinkItem({ link, onEdit, onDelete }: { link: SocialLink, onEdit: () => void, onDelete: () => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: link.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-800 rounded-lg"
    >
      <div className="flex items-center gap-4">
        <button {...attributes} {...listeners} className="cursor-grab p-2">
          <GripVertical className="h-5 w-5 text-gray-500" />
        </button>
        <div>
          <p className="font-semibold capitalize">{link.platform}</p>
          <p className="text-sm text-gray-500 truncate max-w-xs">{link.url}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onEdit}>
          <Edit className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onDelete} className="text-red-500 hover:text-red-600">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}


// Main List Component
export default function SocialLinksList({ socialLinks }: SocialLinksListProps) {
  const queryClient = useQueryClient();
  const [items, setItems] = useState<SocialLink[]>(socialLinks);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedLink, setSelectedLink] = useState<SocialLink | undefined>(undefined);

  useEffect(() => {
    setItems(socialLinks);
  }, [socialLinks]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const reorderMutation = useMutation({
    mutationFn: reorderSocialLinks,
    onSuccess: () => {
      toast.success('Social links reordered!');
      queryClient.invalidateQueries({ queryKey: ['socialLinks'] });
    },
    onError: (error) => {
      toast.error(`Failed to reorder: ${error.message}`);
      setItems(socialLinks); // Revert to original order on error
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSocialLink,
    onSuccess: () => {
        toast.success('Social link deleted!');
        queryClient.invalidateQueries({ queryKey: ['socialLinks'] });
    },
    onError: (error) => {
        toast.error(`Failed to delete: ${error.message}`);
    }
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      const newOrder = arrayMove(items, oldIndex, newIndex);
      setItems(newOrder); // Optimistic update
      
      const reorderedLinks = newOrder.map((link, index) => ({
        id: link.id,
        order: index,
      }));
      reorderMutation.mutate(reorderedLinks);
    }
  };

  const handleAddNew = () => {
    setSelectedLink(undefined);
    setIsDialogOpen(true);
  };

  const handleEdit = (link: SocialLink) => {
    setSelectedLink(link);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
      if(window.confirm('Are you sure you want to delete this link?')) {
          deleteMutation.mutate(id);
      }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Social Links</CardTitle>
        <Button onClick={handleAddNew}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add New
        </Button>
      </CardHeader>
      <CardContent>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
        >
          <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {items.map((link) => (
                <SortableSocialLinkItem 
                    key={link.id} 
                    link={link}
                    onEdit={() => handleEdit(link)}
                    onDelete={() => handleDelete(link.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
        {items.length === 0 && (
            <p className="text-center text-gray-500 py-4">No social links yet. Add one to get started!</p>
        )}
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedLink ? 'Edit Social Link' : 'Add New Social Link'}</DialogTitle>
          </DialogHeader>
          <SocialLinkForm 
            socialLink={selectedLink} 
            onSuccess={() => setIsDialogOpen(false)} 
          />
        </DialogContent>
      </Dialog>
    </Card>
  );
}

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';

import { deleteLink, updateLinkOrder, LinkTreeLink } from '@/lib/api-treeLink';
import LinkForm from './LinkForm';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { GripVertical, Trash2, Edit, PlusCircle } from 'lucide-react';

// Define a type for the animation names
const animationTypes = ['pulse', 'bounce', 'shake', 'none'] as const;
type AnimationType = (typeof animationTypes)[number];

// Animation variants for framer-motion
const animationVariants: Record<AnimationType, any> = {
    pulse: { scale: [1, 1.05, 1], transition: { duration: 1.5, repeat: Infinity } },
    bounce: { y: [0, -10, 0], transition: { duration: 0.8, repeat: Infinity } },
    shake: { x: [0, -5, 5, -5, 5, 0], transition: { duration: 0.5, repeat: Infinity } },
    none: {},
};

// Sortable Item Component
const SortableLinkItem = ({ link }: { link: LinkTreeLink }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: link.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <motion.div
            ref={setNodeRef}
            style={style}
            {...attributes}
            className="flex items-center justify-between p-2 border rounded-lg bg-white shadow-sm"
            animate={animationVariants[link.animation as AnimationType || 'none']}
        >
            <div className="flex items-center flex-grow">
                <div {...listeners} className="cursor-grab p-2">
                    <GripVertical className="h-5 w-5 text-muted-foreground" />
                </div>
                <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-grow p-3 rounded-lg text-center font-semibold text-white"
                    style={{
                        backgroundColor: link.buttonColor || '#000000',
                        borderRadius: `${link.borderRadius || 8}px`,
                    }}
                >
                    {link.title}
                </a>
            </div>
            <div className="flex items-center space-x-2 ml-2">
                <Button variant="outline" size="icon" onClick={() => (window as any).handleEdit(link)}><Edit className="h-4 w-4" /></Button>
                <Button variant="destructive" size="icon" onClick={() => (window as any).handleDelete(link.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
        </motion.div>
    );
};

// Main LinkList Component
interface LinkListProps {
    links: LinkTreeLink[];
}

const LinkList: React.FC<LinkListProps> = ({ links: initialLinks }) => {
    const queryClient = useQueryClient();
    const [links, setLinks] = useState(initialLinks);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedLink, setSelectedLink] = useState<LinkTreeLink | undefined>(undefined);

    const sensors = useSensors(useSensor(PointerSensor));

    const deleteMutation = useMutation({
        mutationFn: deleteLink,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['links'] });
            toast.success('Link deleted successfully.');
        },
        onError: (error: any) => toast.error('Error', { description: error.message }),
    });

    const orderMutation = useMutation({
        mutationFn: updateLinkOrder,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['links'] });
            toast.success('Link order updated!');
        },
        onError: (error: any) => toast.error('Failed to update order', { description: error.message }),
    });

    // Handlers for edit/delete need to be accessible globally for the item component
    (window as any).handleEdit = (link: LinkTreeLink) => {
        setSelectedLink(link);
        setIsFormOpen(true);
    };
    (window as any).handleDelete = (id: string) => deleteMutation.mutate(id);

    const handleAddNew = () => {
        setSelectedLink(undefined);
        setIsFormOpen(true);
    };

    const handleDragEnd = (event: any) => {
        const { active, over } = event;
        if (active.id !== over.id) {
            const oldIndex = links.findIndex((l) => l.id === active.id);
            const newIndex = links.findIndex((l) => l.id === over.id);
            const newOrder = arrayMove(links, oldIndex, newIndex);
            setLinks(newOrder);

            const orderedIds = newOrder.map(l => l.id);
            orderMutation.mutate(orderedIds);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Your Links</h2>
                <Button onClick={handleAddNew}><PlusCircle className="mr-2 h-4 w-4" /> Add New Link</Button>
            </div>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={links.map(l => l.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-3">
                        {links.map((link) => (
                            <SortableLinkItem key={link.id} link={link} />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>

            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{selectedLink ? 'Edit Link' : 'Create New Link'}</DialogTitle>
                    </DialogHeader>
                    <LinkForm link={selectedLink} onClose={() => setIsFormOpen(false)} />
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default LinkList;

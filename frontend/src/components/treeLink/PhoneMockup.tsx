'use client';

import React from 'react';
import { Profile, Link as LinkType, SocialLink } from '@/lib/api-treeLink';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Youtube, Linkedin, Twitter, Instagram, Facebook, Github, Globe
} from 'lucide-react';

interface PhoneMockupProps {
    profile: Profile;
    links: LinkType[];
    socialLinks: SocialLink[];
}

const socialIconMap: { [key: string]: React.ElementType } = {
    youtube: Youtube,
    linkedin: Linkedin,
    twitter: Twitter,
    instagram: Instagram,
    facebook: Facebook,
    github: Github,
    default: Globe,
};

const getSocialIcon = (platform: string) => {
    const Icon = socialIconMap[platform.toLowerCase()] || socialIconMap.default;
    return <Icon className="h-6 w-6" />;
};

export default function PhoneMockup({ profile, links, socialLinks }: PhoneMockupProps) {
    return (
        <div className="sticky top-24">
            <div className="relative mx-auto border-gray-800 dark:border-gray-800 bg-gray-800 border-[14px] rounded-[2.5rem] h-[600px] w-[300px] shadow-xl">
                <div className="w-[148px] h-[18px] bg-gray-800 top-0 rounded-b-[1rem] left-1/2 -translate-x-1/2 absolute"></div>
                <div className="h-[46px] w-[3px] bg-gray-800 absolute -left-[17px] top-[124px] rounded-l-lg"></div>
                <div className="h-[46px] w-[3px] bg-gray-800 absolute -left-[17px] top-[178px] rounded-l-lg"></div>
                <div className="h-[64px] w-[3px] bg-gray-800 absolute -right-[17px] top-[142px] rounded-r-lg"></div>
                <div className="rounded-[2rem] overflow-hidden w-full h-full bg-white dark:bg-gray-900">
                    <div className="text-center p-4 flex flex-col items-center space-y-2 bg-gray-50 dark:bg-gray-800">
                        <Avatar className="h-24 w-24">
                            <AvatarImage src={profile.avatarUrl} alt={profile.name} />
                            <AvatarFallback>{profile.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <h1 className="font-bold text-lg text-gray-800 dark:text-white">@{profile.name}</h1>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{profile.bio}</p>
                        <div className="flex space-x-4 pt-2">
                            {socialLinks.map(link => (
                                <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                                    {getSocialIcon(link.platform)}
                                </a>
                            ))}
                        </div>
                    </div>
                    <div className="p-4 space-y-3 overflow-y-auto">
                        {links.map(link => (
                            <a 
                                key={link.id} 
                                href={link.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="block w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold text-center p-3 rounded-lg transition-transform duration-200 ease-in-out transform hover:scale-105"
                            >
                                {link.title}
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

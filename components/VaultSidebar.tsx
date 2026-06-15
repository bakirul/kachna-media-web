// components/VaultSidebar.tsx
import React, { useState, useEffect } from "react";
import GlobalLiveWidget from "./GlobalLiveWidget";

interface SidebarProps {
  currentFolder: string;
  allFolders: string[];
  onFolderClick: (folderName: string) => void;
  onRootClick: () => void;
  onCreateFolder: () => void;
  onDeleteFolder: (folderName: string) => void;
}

type TreeNode = {
  name: string;
  path: string;
  children: Record<string, TreeNode>;
};

const buildTree = (paths: string[]): TreeNode => {
  const root: TreeNode = { name: "root", path: "", children: {} };
  
  paths.forEach(path => {
    const cleanPath = path.replace(/\/+$/, '');
    if (!cleanPath) return;

    const parts = cleanPath.split('/');
    let current = root;
    let currentPath = "";
    
    parts.forEach(part => {
      if (!part) return;
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      if (!current.children[part]) {
        current.children[part] = {
          name: part,
          path: currentPath,
          children: {}
        };
      }
      current = current.children[part];
    });
  });
  
  return root;
};

const FolderNode = ({ 
  node, 
  currentFolder, 
  expandedFolders, 
  toggleExpand, 
  onFolderClick, 
  onDeleteFolder,
  depth = 0 
}: {
  node: TreeNode,
  currentFolder: string,
  expandedFolders: Set<string>,
  toggleExpand: (path: string, e: React.MouseEvent) => void,
  onFolderClick: (path: string) => void,
  onDeleteFolder: (path: string) => void,
  depth?: number
}) => {
  const hasChildren = Object.keys(node.children).length > 0;
  const isExpanded = expandedFolders.has(node.path);
  const cleanCurrent = currentFolder.replace(/\/+$/, "");
  const isActive = cleanCurrent === node.path;

  const sortedChildren = Object.values(node.children).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div>
      <div 
        className={`group/folder flex items-center justify-between rounded-md text-xs font-medium transition-colors ${
          isActive ? "bg-[#d4af37]/10 text-[#d4af37]" : "text-gray-400 hover:bg-white/5 hover:text-white"
        }`}
        style={{ paddingLeft: `${depth * 16 + 12}px`, paddingRight: '8px' }}
      >
        <div className="flex-1 flex items-center min-w-0 py-1.5">
          {hasChildren ? (
            <button 
              onClick={(e) => toggleExpand(node.path, e)}
              className="p-1 mr-1 text-gray-500 hover:text-white transition-colors shrink-0"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="14" height="14" 
                viewBox="0 0 24 24" 
                fill="none" stroke="currentColor" strokeWidth="2" 
                className={`transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}
              >
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          ) : (
            <div className="w-[22px] h-[22px] shrink-0 mr-1" />
          )}
          
          <button 
            onClick={() => onFolderClick(`${node.path}/`)} 
            className="flex-1 flex items-center gap-2 text-left truncate"
            title={node.name}
          >
            <span className="text-sm shrink-0">📁</span> 
            <span className="truncate">{node.name}</span>
          </button>
        </div>

        <button 
          onClick={(e) => { e.stopPropagation(); onDeleteFolder(node.path); }} 
          className="opacity-0 group-hover/folder:opacity-100 p-1.5 text-gray-500 hover:text-red-400 transition-all shrink-0" 
          title="Delete Folder"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        </button>
      </div>
      
      {hasChildren && isExpanded && (
        <div className="mt-0.5 space-y-0.5">
          {sortedChildren.map(child => (
            <FolderNode 
              key={child.path}
              node={child}
              currentFolder={currentFolder}
              expandedFolders={expandedFolders}
              toggleExpand={toggleExpand}
              onFolderClick={onFolderClick}
              onDeleteFolder={onDeleteFolder}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default function VaultSidebar({ 
  currentFolder, allFolders, onFolderClick, onRootClick, onCreateFolder, onDeleteFolder 
}: SidebarProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const tree = React.useMemo(() => buildTree(allFolders || []), [allFolders]);

  useEffect(() => {
    if (!currentFolder) return;
    setExpandedFolders(prev => {
      const parts = currentFolder.replace(/\/+$/, "").split("/");
      const newExpanded = new Set(prev);
      let path = "";
      let changed = false;
      
      parts.forEach(part => {
        path = path ? `${path}/${part}` : part;
        if (!newExpanded.has(path)) {
          newExpanded.add(path);
          changed = true;
        }
      });
      
      return changed ? newExpanded : prev;
    });
  }, [currentFolder]);

  const toggleExpand = (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  };

  const sortedRootNodes = Object.values(tree.children).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <aside className="w-full h-full bg-[#0a0a0f] flex flex-col shrink-0">
      <div className="h-14 flex items-center justify-between px-5 border-b border-white/5 shrink-0">
        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Directories</h3>
        <button onClick={onCreateFolder} className="text-[#d4af37] hover:text-white transition-colors" title="New Folder">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
            <line x1="12" y1="11" x2="12" y2="17"></line>
            <line x1="9" y1="14" x2="15" y2="14"></line>
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
        <button onClick={onRootClick} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-xs font-medium transition-colors ${currentFolder === "" ? "bg-[#d4af37]/10 text-[#d4af37]" : "text-gray-400 hover:bg-white/5 hover:text-white"}`}>
          <span className="text-lg">🏠</span> CLIENT VAULT
        </button>

        <div className="pt-2">
          {sortedRootNodes.map((child) => (
            <FolderNode 
              key={child.path}
              node={child}
              currentFolder={currentFolder}
              expandedFolders={expandedFolders}
              toggleExpand={toggleExpand}
              onFolderClick={onFolderClick}
              onDeleteFolder={onDeleteFolder}
              depth={0}
            />
          ))}
        </div>
      </div>
      <div className="p-4 border-t border-white/5 shrink-0 bg-[#050505]">
        <GlobalLiveWidget isEmbedded={true} />
      </div>
    </aside>
  );
}
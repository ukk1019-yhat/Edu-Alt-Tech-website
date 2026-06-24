const DRIVE_API_KEY = 'AIzaSyBO6xmRU_shTO5PHHBNhpTNFtXsmoBIjEk';
const ROOT_FOLDER_ID = '1toMlJExBP-titjEoCrn3TjKq6ToEC7rb';

const FOLDER_CATEGORY_MAP: Record<string, string> = {
 'english': 'English',
 'mathematics': 'Mathematics',
 'math': 'Mathematics',
 'science': 'Science',
 'social studies': 'Social Studies',
 'computer science': 'Computer Science',
 'engineering': 'Engineering',
 'management': 'Management',
};

function mapFolderNameToCategory(folderName: string): string {
 const cleaned = folderName
 .toLowerCase()
 .replace(/ resources$/, '')
 .replace(/^\d+\s*[-–]\s*/, '')
 .trim();
 return FOLDER_CATEGORY_MAP[cleaned] || cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

export interface DriveFile {
 id: string;
 name: string;
 mimeType: string;
 size?: string;
 modifiedTime?: string;
 webContentLink?: string;
 webViewLink?: string;
}

export interface DriveFolder {
 id: string;
 name: string;
 files: DriveFile[];
}

async function fetchFromDrive<T>(url: string): Promise<T> {
 const res = await fetch(url);
 if (!res.ok) throw new Error(`Drive API error: ${res.status}`);
 return res.json();
}

export async function getDriveSubfolders(): Promise<DriveFolder[]> {
 const data = await fetchFromDrive<{ files: DriveFile[] }>(
  `https://www.googleapis.com/drive/v3/files?q='${ROOT_FOLDER_ID}'+in+parents+and+mimeType='application/vnd.google-apps.folder'+and+trashed=false&key=${DRIVE_API_KEY}&fields=files(id,name,mimeType)`
 );
 const folders = data.files || [];
 const results = await Promise.all(
  folders.map(async (folder) => {
   try {
    const fileData = await fetchFromDrive<{ files: DriveFile[] }>(
     `https://www.googleapis.com/drive/v3/files?q='${folder.id}'+in+parents+and+trashed=false&key=${DRIVE_API_KEY}&fields=files(id,name,mimeType,size,modifiedTime,webContentLink,webViewLink)`
    );
    return { id: folder.id, name: folder.name, files: fileData.files || [] };
   } catch (e) {
    console.error(`Failed to fetch files for folder ${folder.name}`, e);
    return { id: folder.id, name: folder.name, files: [] };
   }
  })
 );
 return results.filter(r => r.files.length > 0);
}

export function getDriveDownloadUrl(fileId: string): string {
 return `https://drive.google.com/uc?export=download&id=${fileId}`;
}

export function getDriveFileCategory(folderName: string): string {
 return mapFolderNameToCategory(folderName);
}

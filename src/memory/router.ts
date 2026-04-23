/**
 * Memory & Experience Router
 * Based on Page 3 (Phase 3) of the SOP
 * Integrated with Firestore
 */
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  serverTimestamp,
  orderBy,
  limit
} from 'firebase/firestore';
import { db, handleFirestoreError } from '../lib/firebase';

export interface Experience {
  type: 'Pattern' | 'Fix_Trace' | 'Preference' | 'Negative';
  content: string;
  hits: number;
  createdAt: any;
  createdBy: string;
}

export async function retrieveExperiences(queryStr: string) {
  console.log(`Retrieving memory for: ${queryStr}`);
  try {
    // Basic semantic retrieval simulation using tags or type
    const q = query(
      collection(db, 'experiences'),
      orderBy('hits', 'desc'),
      limit(5)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as any)) as Experience[];
  } catch (error) {
    handleFirestoreError(error, 'list', 'experiences');
  }
}

export async function addExperience(type: Experience['type'], content: string, userId: string) {
  try {
    const docRef = await addDoc(collection(db, 'experiences'), {
      type,
      content,
      hits: 1,
      createdAt: serverTimestamp(),
      createdBy: userId
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, 'create', 'experiences');
  }
}

export async function evolveMetaInstructions(fixes: any[]) {
  // Logic to update System Prompt after 2 successful fixes
  console.log("Evaluating meta-evolution for fixes:", fixes.length);
}


# Migration Guide - AI Assistant Enhancement

## 📋 Overview

Panduan ini akan membantu Anda melakukan migrasi dari implementasi AI Assistant yang lama ke versi yang telah ditingkatkan.

## ⚠️ Breaking Changes

### 1. Message Interface Changes

```typescript
// OLD
interface Message {
  role: "user" | "assistant";
  content: string;
}

// NEW
interface Message {
  id: string; // NEW: Unique identifier
  role: "user" | "assistant" | "system"; // NEW: Added system role
  content: string;
  timestamp: Date; // NEW: Message timestamp
  metadata?: {
    // NEW: Additional metadata
    intent?: string;
    confidence?: number;
    processingTime?: number;
  };
}
```

### 2. Storage Functions

```typescript
// OLD
import { transactionStorage } from "@/lib/storage";

// NEW
import { enhancedTransactionStorage } from "@/lib/enhancedStorage";

// Usage changes:
// OLD
await transactionStorage.create(transaction);

// NEW
await enhancedTransactionStorage.create(transaction);
// Note: Auto-invalidates cache
```

## 🔧 Step-by-Step Migration

### Step 1: Install Dependencies

```bash
npm install uuid
npm install @types/uuid --save-dev

# For testing (optional)
npm install -D vitest @vitest/ui
```

### Step 2: Create New Folder Structure

```bash
mkdir -p src/constants
mkdir -p src/types
mkdir -p src/utils
mkdir -p src/services
mkdir -p src/__tests__
```

### Step 3: Add New Files

Copy semua file baru ke project Anda:

```bash
# Constants
cp constants.ts src/constants/

# Types
cp ai.ts src/types/

# Utils
cp validation.ts src/utils/
cp cache.ts src/utils/
cp promptTemplates.ts src/utils/
cp queryEngine.ts src/utils/

# Services
cp aiService.ts src/services/

# Enhanced Storage
cp enhancedStorage.ts src/lib/

# Tests (optional)
cp aiAssistant.test.ts src/__tests__/
```

### Step 4: Update Existing Files

#### A. Update `storage.ts`

Tambahkan export untuk enhanced storage di akhir file:

```typescript
// Add at the end of storage.ts
export * from "./enhancedStorage";
```

#### B. Backup dan Replace `useAIAssistant.ts`

```bash
# Backup file lama
cp src/hooks/useAIAssistant.ts src/hooks/useAIAssistant.ts.backup

# Replace dengan file baru
cp enhanced_useai.ts src/hooks/useAIAssistant.ts
```

#### C. Update Component yang Menggunakan AI Assistant

```typescript
// OLD
import { useAIAssistant } from "@/hooks/useAIAssistant";

const { messages, input, isLoading, handleSend, setInput } = useAIAssistant();

// NEW - Added features
import { useAIAssistant } from "@/hooks/useAIAssistant";

const {
  messages, // Enhanced with metadata
  input,
  isLoading,
  suggestedPrompts, // NEW: Dynamic suggestions
  pendingTransaction, // NEW: Transaction awaiting confirmation
  handleSend,
  setInput,
  handleKeyPress, // NEW: Keyboard shortcuts
  clearConversation, // NEW: Clear chat
} = useAIAssistant();
```

### Step 5: Update UI Components

Replace your chat component dengan `AIChatInterface.tsx` atau update existing component:

```typescript
// Example integration
import { AIChatInterface } from "@/components/AIChatInterface";

function AIPage() {
  return (
    <div className="container mx-auto p-4">
      <AIChatInterface />
    </div>
  );
}
```

### Step 6: Update Environment Variables (if needed)

Tidak ada perubahan pada environment variables, tapi pastikan Anda memiliki:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Step 7: Test Migration

1. **Test Basic Functionality**

```typescript
// Test transaction logging
"Catat pengeluaran makan 50rb dari dompet"

// Test queries
"Berapa pengeluaran bulan ini?"

// Test confirmation flow
"Transfer 100rb" -> "Dari dompet ke bank"
```

2. **Test Error Handling**

```typescript
// Test validation
"Catat pengeluaran -50rb"; // Should show error

// Test missing info
"Catat pengeluaran 50rb"; // Should ask for details
```

3. **Test Cache**

```typescript
// Run same query twice, second should be faster
"Berapa pengeluaran bulan ini?";
"Berapa pengeluaran bulan ini?"; // From cache
```

## 🔄 Code Changes Required

### 1. Transaction Creation

```typescript
// OLD
await transactionStorage.create({
  description: "Makan",
  amount: 50000,
  type: "expense",
  transactionDate: new Date().toISOString(),
  userId: user.id,
  categoryId: categoryId,
  sourceFundId: fundSourceId,
  destinationFundId: null,
});

// NEW - Same API, but with caching
await enhancedTransactionStorage.create({
  description: "Makan",
  amount: 50000,
  type: "expense",
  transactionDate: new Date().toISOString(),
  userId: user.id,
  categoryId: categoryId,
  sourceFundId: fundSourceId,
  destinationFundId: null,
});
// Cache automatically invalidated after create
```

### 2. Data Fetching

```typescript
// OLD
const categories = await categoryStorage.getAll(userId);
const fundSources = await fundSourceStorage.getAll(userId);

// NEW - With caching
const categories = await enhancedCategoryStorage.getAll(userId);
const fundSources = await enhancedFundSourceStorage.getAll(userId);
// Results cached for 5 minutes
```

### 3. Manual Cache Invalidation

```typescript
import { invalidateUserCache } from "@/utils/cache";

// After manual data updates outside enhanced storage
await supabase.from("transactions").update(...);
invalidateUserCache(userId);
```

## 📊 Performance Comparison

### Before Migration

```
First query:  ~500ms (DB fetch)
Second query: ~500ms (DB fetch again)
Third query:  ~500ms (DB fetch again)
```

### After Migration

```
First query:  ~500ms (DB fetch + cache)
Second query: ~50ms  (from cache)
Third query:  ~50ms  (from cache)
```

**Performance gain: ~90% faster for repeated queries**

## 🐛 Common Migration Issues

### Issue 1: Missing uuid Package

**Error:**

```
Cannot find module 'uuid'
```

**Solution:**

```bash
npm install uuid
npm install @types/uuid --save-dev
```

### Issue 2: Type Errors

**Error:**

```
Property 'id' does not exist on type 'Message'
```

**Solution:**
Update your Message type imports:

```typescript
import { Message } from "@/types/ai"; // Not from old location
```

### Issue 3: Cache Not Working

**Error:**
Queries are still slow

**Solution:**
Make sure you're using enhanced storage functions:

```typescript
// Wrong
import { categoryStorage } from "@/lib/storage";

// Correct
import { enhancedCategoryStorage } from "@/lib/enhancedStorage";
```

### Issue 4: Conversation Context Not Working

**Error:**
AI doesn't remember previous messages

**Solution:**
Check that you're using the new useAIAssistant hook, not the old one:

```typescript
// Make sure you replaced the file completely
import { useAIAssistant } from "@/hooks/useAIAssistant";
```

## 🧪 Testing After Migration

### Manual Testing Checklist

- [ ] Transaction logging works
- [ ] Transaction confirmation works
- [ ] Query data works
- [ ] Suggested prompts appear
- [ ] Cache improves performance
- [ ] Error messages are clear
- [ ] Validation catches errors
- [ ] Auto-creation of categories works
- [ ] Auto-creation of fund sources works
- [ ] Clear conversation works
- [ ] Keyboard shortcuts work (Enter to send)
- [ ] Pending transaction UI shows correctly

### Automated Testing

Run the test suite:

```bash
npm run test
```

Expected output:

```
✓ Validation Utils (8 tests)
✓ QueryEngine (7 tests)
✓ AIService (6 tests)
✓ CacheManager (7 tests)

Test Files  4 passed (4)
Tests  28 passed (28)
```

## 📱 UI/UX Changes

### Visual Changes Users Will Notice

1. **Message Timestamps**: Each message now shows time
2. **Pending Transaction Badge**: Yellow badge when confirmation needed
3. **Suggested Prompts**: Context-aware suggestions
4. **Better Loading State**: "Sedang berpikir..." indicator
5. **Quick Confirmation**: Yes/No buttons for pending transactions
6. **Clear Button**: Easy way to start fresh conversation

### Behavioral Changes

1. **Smarter Responses**: AI remembers context
2. **Better Validation**: Catches errors before saving
3. **Confirmation Flow**: Asks for confirmation when uncertain
4. **Faster Queries**: Results cached
5. **Auto-creation**: Creates categories/funds if not exist

## 🔐 Security Considerations

### Important Notes

1. **API Keys**: Still in localStorage (OK for development)
   - For production: Implement backend proxy
2. **Input Validation**: Now comprehensive
   - All inputs validated before processing
3. **Cache Security**: In-memory only
   - No sensitive data persisted
4. **Error Messages**: Sanitized
   - Don't expose internal details

### Recommended Production Changes

```typescript
// TODO: Move to backend
// src/services/backendAIService.ts
export const processAIRequest = async (userMessage: string) => {
  const response = await fetch("/api/ai/process", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: userMessage }),
  });
  return response.json();
};
```

## 🎯 Rollback Plan

If migration fails, rollback is easy:

```bash
# Restore backup
cp src/hooks/useAIAssistant.ts.backup src/hooks/useAIAssistant.ts

# Remove new files (optional)
rm -rf src/constants
rm -rf src/utils/validation.ts
rm -rf src/utils/cache.ts
rm -rf src/utils/promptTemplates.ts
rm -rf src/utils/queryEngine.ts
rm -rf src/services/aiService.ts
rm -rf src/lib/enhancedStorage.ts

# Clear cache
# Open browser console and run:
localStorage.clear();
```

## 📈 Next Steps After Migration

1. **Monitor Performance**
   - Check console for processing times
   - Monitor cache hit rates
2. **Gather User Feedback**
   - Are confirmation flows helpful?
   - Are suggested prompts relevant?
3. **Fine-tune AI Prompts**
   - Adjust confidence thresholds
   - Update example prompts
4. **Add More Query Types**
   - Extend QueryEngine for your needs
5. **Implement Backend Proxy**
   - Move API key management to server
   - Add rate limiting
6. **Add Analytics**
   - Track popular queries
   - Monitor error rates

## 💡 Tips for Smooth Migration

1. **Migrate in Staging First**: Test thoroughly before production
2. **Backup Database**: Always backup before major changes
3. **Monitor Logs**: Check console for warnings/errors
4. **Gradual Rollout**: Consider feature flags for gradual rollout
5. **Document Changes**: Keep this guide updated with your changes

## 📞 Support

If you encounter issues:

1. Check console for error messages
2. Review this migration guide
3. Check the main README for examples
4. Review test files for usage patterns
5. Create an issue with:
   - Error message
   - Steps to reproduce
   - Expected vs actual behavior
   - Browser/environment info

## ✅ Migration Checklist

Before going to production:

- [ ] All new files added
- [ ] Dependencies installed
- [ ] Old files backed up
- [ ] Code compiled without errors
- [ ] Manual tests passed
- [ ] Automated tests passed (if implemented)
- [ ] Performance improved
- [ ] Error handling works
- [ ] Cache working correctly
- [ ] UI/UX changes verified
- [ ] Documentation updated
- [ ] Team trained on new features
- [ ] Rollback plan tested
- [ ] Production environment ready

## 🎉 Success Criteria

Migration is successful when:

1. ✅ All features from old version work
2. ✅ New features work as expected
3. ✅ Performance improved (check metrics)
4. ✅ No regression bugs
5. ✅ User feedback positive
6. ✅ Team comfortable with new code
7. ✅ Documentation complete

---

**Good luck with your migration! 🚀**

Need help? Check the AI_ASSISTANT_README.md for detailed documentation.

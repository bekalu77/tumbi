import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface TenderFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TenderFormDialog = ({ open, onOpenChange }: TenderFormDialogProps) => {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    title: '',
    closing: '',
    opening: '',
    region: '',
    category: '',
    published: '',
    featured: 'false',
    tender_detail: '',
    eligibility_criteria: '',
    required_documents: '',
    bid_document_price: '',
    bid_bond: '',
    contact_info: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      featured: value,
    }));
  };

  const handleDateChange = (name: string, date: Date | undefined) => {
    if (date) {
      setFormData((prev) => ({
        ...prev,
        [name]: format(date, 'yyyy-MM-dd'),
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to create a tender.",
        variant: "destructive",
      });
      return;
    }

    const tender_no = Date.now();

    const frontmatter = `---
title: "${formData.title}"
tender_no: ${tender_no}
closing: "${formData.closing}"
opening: "${formData.opening}"
region: "${formData.region}"
category: "${formData.category}"
published: "${formData.published}"
featured: ${formData.featured}
---`;

    const content = `
# ${formData.title}

## 📋 Tender Details

${formData.tender_detail}

---

## 📑 Eligibility Criteria

${formData.eligibility_criteria}

---

## 📄 Required Documents

${formData.required_documents}

---

## 💰 Bid Information

- **Bid Document Price**: ${formData.bid_document_price === '0' ? 'Free' : formData.bid_document_price}
- **Bid Bond**: ${formData.bid_bond}

---

## 📞 Contact Information

${formData.contact_info}

---

*Document Generated on: ${new Date().toLocaleDateString()}*
`;

    const markdown = `${frontmatter}\n\n${content}`;

    try {
      const response = await fetch('/api/tenders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: `${formData.title.toLowerCase().replace(/\s+/g, '-')}.md`,
          content: markdown,
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Tender created successfully.",
        });
        setFormData({
            title: '',
            closing: '',
            opening: '',
            region: '',
            category: '',
            published: '',
            featured: 'false',
            tender_detail: '',
            eligibility_criteria: '',
            required_documents: '',
            bid_document_price: '',
            bid_bond: '',
            contact_info: '',
        });
        onOpenChange(false);
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.message || "Failed to create tender.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error creating tender:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{t('addNewTender')}</DialogTitle>
        </DialogHeader>
        <div className="max-h-[80vh] overflow-y-auto p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input name="title" placeholder={t('title')} value={formData.title} onChange={handleChange} required />
            
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.closing && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.closing ? format(new Date(formData.closing), "PPP") : <span>{t('pickClosingDate')}</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.closing ? new Date(formData.closing) : undefined}
                  onSelect={(date) => handleDateChange('closing', date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.opening && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.opening ? format(new Date(formData.opening), "PPP") : <span>{t('pickOpeningDate')}</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.opening ? new Date(formData.opening) : undefined}
                  onSelect={(date) => handleDateChange('opening', date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Input name="region" placeholder={t('region')} value={formData.region} onChange={handleChange} required />
            <Input name="category" placeholder={t('category')} value={formData.category} onChange={handleChange} required />

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.published && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.published ? format(new Date(formData.published), "PPP") : <span>{t('pickPublishedDate')}</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.published ? new Date(formData.published) : undefined}
                  onSelect={(date) => handleDateChange('published', date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Select onValueChange={handleSelectChange} value={formData.featured}>
              <SelectTrigger>
                <SelectValue placeholder={t('featured')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">True</SelectItem>
                <SelectItem value="false">False</SelectItem>
              </SelectContent>
            </Select>
            <Textarea name="tender_detail" placeholder={t('tenderDetail')} value={formData.tender_detail} onChange={handleChange} required />
            <Textarea name="eligibility_criteria" placeholder={t('eligibilityCriteria')} value={formData.eligibility_criteria} onChange={handleChange} required />
            <Textarea name="required_documents" placeholder={t('requiredDocuments')} value={formData.required_documents} onChange={handleChange} required />
            <Input name="bid_document_price" placeholder={t('bidDocumentPrice')} value={formData.bid_document_price} onChange={handleChange} required />
            <Input name="bid_bond" placeholder={t('bidBond')} value={formData.bid_bond} onChange={handleChange} required />
            <Textarea name="contact_info" placeholder={t('contactInformation')} value={formData.contact_info} onChange={handleChange} required />
            <Button type="submit">{t('createTender')}</Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TenderFormDialog;

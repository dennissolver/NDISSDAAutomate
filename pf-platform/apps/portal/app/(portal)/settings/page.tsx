'use client';

import { useEffect, useState } from 'react';
import {
  User,
  Building,
  CreditCard,
  Bell,
  Save,
  Check,
  AlertCircle,
  Loader2,
  Mail,
  Phone,
  Volume2,
} from 'lucide-react';
import { createClientSupabaseClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface ClientData {
  id: string;
  contact_name: string;
  email: string;
  phone: string | null;
  entity_type: string | null;
  entity_name: string | null;
  abn: string | null;
  bank_bsb: string | null;
  bank_account_number: string | null;
  bank_account_name: string | null;
  notification_email: boolean;
  notification_voice: boolean;
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export default function SettingsPage() {
  const [client, setClient] = useState<ClientData | null>(null);
  const [loading, setLoading] = useState(true);

  // Contact form state
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [contactSaveStatus, setContactSaveStatus] = useState<SaveStatus>('idle');

  // Bank details form state
  const [bankBsb, setBankBsb] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');
  const [bankSaveStatus, setBankSaveStatus] = useState<SaveStatus>('idle');
  const [confirmBankUpdate, setConfirmBankUpdate] = useState(false);

  // Notification preferences
  const [notifEmail, setNotifEmail] = useState(false);
  const [notifVoice, setNotifVoice] = useState(false);
  const [notifSaveStatus, setNotifSaveStatus] = useState<SaveStatus>('idle');

  useEffect(() => {
    async function loadClient() {
      const supabase = createClientSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('clients')
        .select('*')
        .eq('auth_user_id', user.id)
        .single();

      if (data) {
        setClient(data as ClientData);
        setContactName(data.contact_name || '');
        setEmail(data.email || '');
        setPhone(data.phone || '');
        setBankBsb(data.bank_bsb || '');
        setBankAccountNumber(data.bank_account_number || '');
        setBankAccountName(data.bank_account_name || '');
        setNotifEmail(data.notification_email ?? true);
        setNotifVoice(data.notification_voice ?? false);
      }

      setLoading(false);
    }

    loadClient();
  }, []);

  const saveContact = async () => {
    if (!client) return;
    setContactSaveStatus('saving');
    try {
      const supabase = createClientSupabaseClient();
      const { error } = await supabase
        .from('clients')
        .update({
          contact_name: contactName,
          email: email,
          phone: phone || null,
        })
        .eq('id', client.id);

      if (error) throw error;
      setContactSaveStatus('saved');
      setTimeout(() => setContactSaveStatus('idle'), 2000);
    } catch {
      setContactSaveStatus('error');
      setTimeout(() => setContactSaveStatus('idle'), 3000);
    }
  };

  const saveBankDetails = async () => {
    if (!client) return;
    if (!confirmBankUpdate) {
      setConfirmBankUpdate(true);
      return;
    }

    setBankSaveStatus('saving');
    try {
      const supabase = createClientSupabaseClient();
      const { error } = await supabase
        .from('clients')
        .update({
          bank_bsb: bankBsb || null,
          bank_account_number: bankAccountNumber || null,
          bank_account_name: bankAccountName || null,
        })
        .eq('id', client.id);

      if (error) throw error;
      setBankSaveStatus('saved');
      setConfirmBankUpdate(false);
      setTimeout(() => setBankSaveStatus('idle'), 2000);
    } catch {
      setBankSaveStatus('error');
      setTimeout(() => setBankSaveStatus('idle'), 3000);
    }
  };

  const saveNotifications = async () => {
    if (!client) return;
    setNotifSaveStatus('saving');
    try {
      const supabase = createClientSupabaseClient();
      const { error } = await supabase
        .from('clients')
        .update({
          notification_email: notifEmail,
          notification_voice: notifVoice,
        })
        .eq('id', client.id);

      if (error) throw error;
      setNotifSaveStatus('saved');
      setTimeout(() => setNotifSaveStatus('idle'), 2000);
    } catch {
      setNotifSaveStatus('error');
      setTimeout(() => setNotifSaveStatus('idle'), 3000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <svg className="mx-auto h-8 w-8 animate-spin text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="mt-3 text-sm text-gray-500">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="py-24 text-center">
        <AlertCircle className="mx-auto h-10 w-10 text-gray-300" />
        <p className="mt-3 text-sm text-gray-500">Could not load your profile. Please try signing in again.</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your contact information, bank details, and notification preferences.
        </p>
      </div>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
              <User className="h-4.5 w-4.5 text-blue-600" />
            </div>
            <div>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>Update your name, email, and phone number</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              id="contact-name"
              label="Full name"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="John Smith"
            />
            <Input
              id="email"
              label="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@example.com"
            />
            <Input
              id="phone"
              label="Phone number"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0412 345 678"
            />
          </div>
          <div className="mt-5 flex items-center gap-3">
            <Button onClick={saveContact} disabled={contactSaveStatus === 'saving'}>
              {contactSaveStatus === 'saving' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {contactSaveStatus === 'saved' && <Check className="mr-2 h-4 w-4" />}
              {contactSaveStatus === 'saved' ? 'Saved' : 'Save changes'}
            </Button>
            {contactSaveStatus === 'error' && (
              <span className="text-sm text-red-600">Failed to save. Please try again.</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Entity Details (read-only) */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100">
              <Building className="h-4.5 w-4.5 text-gray-600" />
            </div>
            <div>
              <CardTitle>Entity Details</CardTitle>
              <CardDescription>
                Your entity details are managed by Property Friends. Contact us to make changes.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Entity type</label>
              <div className="flex h-10 items-center rounded-md border border-gray-200 bg-gray-50 px-3 text-sm text-gray-600">
                {client.entity_type
                  ? client.entity_type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
                  : '--'}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Entity name</label>
              <div className="flex h-10 items-center rounded-md border border-gray-200 bg-gray-50 px-3 text-sm text-gray-600">
                {client.entity_name || '--'}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">ABN</label>
              <div className="flex h-10 items-center rounded-md border border-gray-200 bg-gray-50 px-3 text-sm text-gray-600 tabular-nums">
                {client.abn || '--'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bank Details */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-50">
              <CreditCard className="h-4.5 w-4.5 text-green-600" />
            </div>
            <div>
              <CardTitle>Bank Details</CardTitle>
              <CardDescription>
                Your payout bank account. Changes will apply from the next statement period.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              id="bank-account-name"
              label="Account name"
              value={bankAccountName}
              onChange={(e) => { setBankAccountName(e.target.value); setConfirmBankUpdate(false); }}
              placeholder="John Smith"
            />
            <div /> {/* spacer */}
            <Input
              id="bank-bsb"
              label="BSB"
              value={bankBsb}
              onChange={(e) => { setBankBsb(e.target.value); setConfirmBankUpdate(false); }}
              placeholder="000-000"
              maxLength={7}
            />
            <Input
              id="bank-account-number"
              label="Account number"
              value={bankAccountNumber}
              onChange={(e) => { setBankAccountNumber(e.target.value); setConfirmBankUpdate(false); }}
              placeholder="12345678"
              maxLength={12}
            />
          </div>
          <div className="mt-5 flex items-center gap-3">
            <Button
              onClick={saveBankDetails}
              disabled={bankSaveStatus === 'saving'}
              variant={confirmBankUpdate ? 'destructive' : 'default'}
            >
              {bankSaveStatus === 'saving' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {bankSaveStatus === 'saved' && <Check className="mr-2 h-4 w-4" />}
              {bankSaveStatus === 'saved'
                ? 'Saved'
                : confirmBankUpdate
                  ? 'Confirm bank details update'
                  : 'Update bank details'}
            </Button>
            {confirmBankUpdate && bankSaveStatus === 'idle' && (
              <span className="text-sm text-amber-600">
                Please confirm you want to update your bank details.
              </span>
            )}
            {bankSaveStatus === 'error' && (
              <span className="text-sm text-red-600">Failed to save. Please try again.</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50">
              <Bell className="h-4.5 w-4.5 text-purple-600" />
            </div>
            <div>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Choose how you want to receive statement notifications</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Email toggle */}
            <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
                  <Mail className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Email notifications</p>
                  <p className="text-xs text-gray-500">Receive statement summaries via email</p>
                </div>
              </div>
              <button
                onClick={() => setNotifEmail(!notifEmail)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  notifEmail ? 'bg-blue-600' : 'bg-gray-200'
                }`}
                role="switch"
                aria-checked={notifEmail}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform ${
                    notifEmail ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Voice summary toggle */}
            <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50">
                  <Volume2 className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Voice summaries</p>
                  <p className="text-xs text-gray-500">Receive AI-generated voice summaries of your statements</p>
                </div>
              </div>
              <button
                onClick={() => setNotifVoice(!notifVoice)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  notifVoice ? 'bg-blue-600' : 'bg-gray-200'
                }`}
                role="switch"
                aria-checked={notifVoice}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform ${
                    notifVoice ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="mt-5 flex items-center gap-3">
            <Button onClick={saveNotifications} disabled={notifSaveStatus === 'saving'}>
              {notifSaveStatus === 'saving' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {notifSaveStatus === 'saved' && <Check className="mr-2 h-4 w-4" />}
              {notifSaveStatus === 'saved' ? 'Saved' : 'Save preferences'}
            </Button>
            {notifSaveStatus === 'error' && (
              <span className="text-sm text-red-600">Failed to save. Please try again.</span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

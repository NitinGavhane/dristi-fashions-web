import React, { useState } from 'react';
import { ArrowLeft, Check, Edit3, MapPin, Plus, Trash2 } from 'lucide-react';
import { AddressForm } from '../components/common/AddressForm';
import { EmptyState, Spinner } from '../components/common/States';
import { useStore } from '../context/StoreContext';
import type { Address } from '../types';

interface AddressesPageProps {
  onNavigate: (path: string) => void;
}

export const AddressesPage: React.FC<AddressesPageProps> = ({ onNavigate }) => {
  const {
    user,
    authLoading,
    isAuthenticated,
    addresses,
    addressesLoading,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
  } = useStore();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Address | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);

  if (authLoading) return <Spinner label="Loading your addresses…" className="min-h-[50vh]" />;

  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] max-w-md mx-auto px-4 py-16">
        <EmptyState
          icon={<MapPin className="w-12 h-12" />}
          title="Saved Addresses"
          message="Sign in to manage where your orders are delivered."
          actionLabel="Sign In"
          onAction={() => onNavigate('/login?next=/profile/addresses')}
        />
      </div>
    );
  }

  const openAdd = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (address: Address) => {
    setEditing(address);
    setFormOpen(true);
  };

  return (
    <div className="min-h-screen max-w-4xl mx-auto px-4 py-8 space-y-6">
      <button
        onClick={() => onNavigate('/profile')}
        className="inline-flex items-center gap-2 text-xs font-bold text-[#0d1648] hover:text-[#755b00]"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#c6c5d0]/30 pb-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#0d1648]">Saved Addresses</h1>
          <p className="text-xs text-[#767680] font-sans mt-1">Manage where your orders are delivered.</p>
        </div>
        {!formOpen && (
          <button onClick={openAdd} className="btn-primary text-xs px-5 py-2.5 inline-flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Address
          </button>
        )}
      </div>

      {formOpen && (
        <div className="bg-white rounded-xl border border-[#c6c5d0]/30 shadow-md p-6">
          <h2 className="font-serif text-lg font-bold text-[#0d1648] mb-4">
            {editing ? 'Edit Address' : 'Add a New Address'}
          </h2>
          <AddressForm
            // Remounting on edit resets the fields to the address being edited.
            key={editing?.id ?? 'new'}
            initial={editing}
            defaultName={user?.fullName}
            defaultPhone={user?.phone}
            forceDefault={!editing && addresses.length === 0}
            submitLabel={editing ? 'Save Changes' : 'Save Address'}
            onCancel={() => setFormOpen(false)}
            onSubmit={async data => {
              const ok = editing ? await updateAddress(editing.id, data) : await addAddress(data);
              if (ok) {
                setFormOpen(false);
                setEditing(null);
              }
            }}
          />
        </div>
      )}

      {addressesLoading && addresses.length === 0 ? (
        <Spinner label="Loading your addresses…" />
      ) : addresses.length === 0 && !formOpen ? (
        <EmptyState
          icon={<MapPin className="w-10 h-10" />}
          title="No addresses saved"
          message="Add a delivery address so checkout is one step quicker."
          actionLabel="Add Address"
          onAction={openAdd}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map(addr => (
            <div
              key={addr.id}
              className={`bg-white rounded-xl p-5 shadow-md border space-y-3 ${
                addr.isDefault ? 'border-[#755b00] ring-1 ring-[#fed255]' : 'border-[#c6c5d0]/40'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <MapPin className="w-4 h-4 shrink-0 text-[#755b00]" />
                  <span className="truncate font-bold text-xs text-[#0d1648] uppercase tracking-wider">{addr.type}</span>
                  {addr.isDefault && (
                    <span className="text-[9px] font-bold bg-[#0d1648] text-[#fed255] px-2 py-0.5 rounded-full uppercase">
                      Default
                    </span>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => openEdit(addr)}
                    className="p-1.5 text-[#767680] hover:text-[#0d1648]"
                    aria-label="Edit address"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setConfirmingDelete(addr.id)}
                    className="p-1.5 text-[#767680] hover:text-[#ba1a1a]"
                    aria-label="Delete address"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="text-xs font-sans">
                <p className="font-semibold text-[#0d1648]">{addr.fullName}</p>
                <p className="text-[#46464f] mt-0.5 leading-relaxed">
                  {addr.street}, {addr.city}, {addr.state} {addr.pincode}
                </p>
                <p className="text-[#767680] mt-0.5">{addr.phone}</p>
              </div>

              {confirmingDelete === addr.id ? (
                <div className="flex items-center gap-2 pt-2 border-t border-[#c6c5d0]/30">
                  <span className="text-[11px] text-[#ba1a1a] font-sans flex-1">Delete this address?</span>
                  <button
                    onClick={async () => {
                      await deleteAddress(addr.id);
                      setConfirmingDelete(null);
                    }}
                    className="text-[11px] font-bold text-[#ba1a1a] hover:underline"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setConfirmingDelete(null)}
                    className="text-[11px] font-bold text-[#767680] hover:underline"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                !addr.isDefault && (
                  <button
                    onClick={() => void setDefaultAddress(addr.id)}
                    className="text-[11px] font-bold text-[#755b00] hover:underline inline-flex items-center gap-1 pt-2 border-t border-[#c6c5d0]/30 w-full"
                  >
                    <Check className="w-3.5 h-3.5" /> Set as default
                  </button>
                )
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

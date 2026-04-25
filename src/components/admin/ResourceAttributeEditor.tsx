import { component$, useSignal, useStore, $, PropFunction } from '@builder.io/qwik';
import { Badge, Btn, FormField } from '~/components/ds';
import { apiClient, resourceAttributeService } from '~/services';

interface Attribute {
  id: string;
  name: string;
  display_name: string;
  type?: string;
}

export interface ResourceAttributeEditorProps {
  resourceType: string; // 'site', 'report', 'expense', etc.
  resourceId: string;
  onUpdate$?: PropFunction<() => void>;
}

export const ResourceAttributeEditor = component$<ResourceAttributeEditorProps>(
  ({ resourceType, resourceId, onUpdate$ }) => {
    const resourceAttributes = useSignal<Record<string, string>>({});
    const allAttributes = useSignal<Attribute[]>([]);
    const showAssignModal = useSignal(false);
    const loading = useSignal(false);
    const error = useSignal('');
    const success = useSignal('');

    const assignForm = useStore({
      attribute_id: '',
      value: '',
      valid_until: ''
    });

    // Load data
    const loadData = $(async () => {
      try {
        loading.value = true;
        const [attrs, allAttrs] = await Promise.all([
          resourceAttributeService.getResourceAttributes(resourceType, resourceId),
          apiClient.get<Attribute[]>('/attributes?type=resource')
        ]);

        resourceAttributes.value = attrs;
        allAttributes.value = allAttrs;
      } catch (err: any) {
        error.value = err.message;
      } finally {
        loading.value = false;
      }
    });

    // Handle assign attribute
    const handleAssignAttribute = $(async () => {
      if (!assignForm.attribute_id || !assignForm.value) {
        error.value = 'Please select an attribute and enter a value';
        return;
      }

      try {
        loading.value = true;
        error.value = '';

        await resourceAttributeService.assignResourceAttribute({
          resource_type: resourceType,
          resource_id: resourceId,
          attribute_id: assignForm.attribute_id,
          value: assignForm.value,
          valid_until: assignForm.valid_until || undefined
        });

        success.value = 'Attribute assigned successfully!';
        showAssignModal.value = false;

        // Reset form
        assignForm.attribute_id = '';
        assignForm.value = '';
        assignForm.valid_until = '';

        // Reload data
        await loadData();

        // Notify parent
        if (onUpdate$) {
          await onUpdate$();
        }

        setTimeout(() => { success.value = ''; }, 3000);
      } catch (err: any) {
        error.value = err.message;
      } finally {
        loading.value = false;
      }
    });

    // Handle remove attribute
    const handleRemoveAttribute = $((attributeId: string) => {
      if (!confirm('Are you sure you want to remove this attribute?')) return;

      (async () => {
        try {
          loading.value = true;
          await resourceAttributeService.removeResourceAttribute(
            resourceType,
            resourceId,
            attributeId
          );
          success.value = 'Attribute removed successfully!';
          await loadData();

          if (onUpdate$) {
            await onUpdate$();
          }

          setTimeout(() => { success.value = ''; }, 3000);
        } catch (err: any) {
          error.value = err.message;
        } finally {
          loading.value = false;
        }
      })();
    });

    return (
      <div class="space-y-4">
        {/* Header */}
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900">Resource Attributes</h3>
          <Btn
            type="button"
            onClick$={() => {
              loadData();
              showAssignModal.value = true;
            }}
            size="sm"
            disabled={loading.value}
          >
            <span class="i-heroicons-plus mr-1"></span>
            Add Attribute
          </Btn>
        </div>

        {/* Alerts */}
        {error.value && (
          <div class="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
            {error.value}
          </div>
        )}

        {success.value && (
          <div class="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded text-sm">
            {success.value}
          </div>
        )}

        {/* Attributes List */}
        <div class="bg-gray-50 rounded-lg border border-gray-200 p-4">
          {Object.keys(resourceAttributes.value).length === 0 ? (
            <div class="text-center text-gray-500 py-4">
              <p class="text-sm">No attributes assigned</p>
            </div>
          ) : (
            <div class="space-y-2">
              {Object.entries(resourceAttributes.value).map(([name, value]) => {
                const attribute = allAttributes.value.find(attr => attr.name === name);
                return (
                  <div
                    key={name}
                    class="flex items-center justify-between bg-white p-3 rounded border border-gray-200"
                  >
                    <div class="flex-1">
                      <div class="font-medium text-sm text-gray-900">
                        {attribute?.display_name || name}
                      </div>
                      <div class="text-xs text-gray-500 mt-0.5">
                        <span class="font-mono">{name}</span>
                        <span class="mx-2">•</span>
                        <Badge variant="info">
                          {value}
                        </Badge>
                      </div>
                    </div>
                      <Btn
                      type="button"
                        size="sm"
                        variant="danger"
                      onClick$={() => attribute && handleRemoveAttribute(attribute.id)}
                        class="text-red-600 hover:text-red-800 transition-colors ml-2"
                      disabled={loading.value}
                    >
                      <span class="i-heroicons-trash text-sm"></span>
                      </Btn>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Info */}
        <div class="text-xs text-gray-500">
          <span class="i-heroicons-information-circle mr-1"></span>
          Resource attributes are used in ABAC policies for fine-grained access control
        </div>

        {/* Assign Modal */}
        {showAssignModal.value && (
          <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
              <div class="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                <h3 class="text-lg font-semibold text-gray-900">Assign Attribute</h3>
                <Btn
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick$={() => showAssignModal.value = false}
                  class="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <span class="i-heroicons-x-mark text-xl"></span>
                </Btn>
              </div>

              <form preventdefault:submit onSubmit$={handleAssignAttribute} class="p-4 space-y-3">
                {/* Attribute Selection */}
                <FormField id={`attr-${resourceId}`} label="Attribute" required>
                  <select
                    id={`attr-${resourceId}`}
                    value={assignForm.attribute_id}
                    onInput$={(e) => {
                      assignForm.attribute_id = (e.target as HTMLSelectElement).value;
                      assignForm.value = '';
                    }}
                    class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  >
                    <option value="">Select an attribute...</option>
                    {allAttributes.value
                      .filter(attr => !Object.keys(resourceAttributes.value).includes(attr.name))
                      .map(attr => (
                        <option key={attr.id} value={attr.id}>
                          {`${attr.display_name} (${attr.name})`}
                        </option>
                      ))}
                  </select>
                </FormField>

                {/* Value Input */}
                <FormField id={`value-${resourceId}`} label="Value" required>
                  <input
                    id={`value-${resourceId}`}
                    type="text"
                    value={assignForm.value}
                    onInput$={(e) => assignForm.value = (e.target as HTMLInputElement).value}
                    class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter value..."
                    required
                  />
                </FormField>

                {/* Valid Until */}
                <FormField id={`valid-${resourceId}`} label="Valid Until (Optional)">
                  <input
                    id={`valid-${resourceId}`}
                    type="datetime-local"
                    value={assignForm.valid_until}
                    onInput$={(e) => assignForm.valid_until = (e.target as HTMLInputElement).value}
                    class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </FormField>

                {/* Actions */}
                <div class="flex justify-end space-x-2 pt-2">
                  <Btn
                    type="button"
                    onClick$={() => showAssignModal.value = false}
                    variant="secondary"
                    size="sm"
                  >
                    Cancel
                  </Btn>
                  <Btn
                    type="submit"
                    size="sm"
                    disabled={loading.value}
                  >
                    {loading.value ? 'Assigning...' : 'Assign'}
                  </Btn>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }
);

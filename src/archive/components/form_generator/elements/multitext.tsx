import { $, component$, Signal } from '@builder.io/qwik';

export type MultitextProps = {
    newMemberEmail: Signal;
    memberEmails: Signal<string[]>
};

export const MultiText = component$<MultitextProps>((props) => {


    const handleEmailKeyPress = $((e: KeyboardEvent) => {
        if ((e.key === 'Enter' || e.key === ',' || e.key ===';') && props.newMemberEmail.value.trim() !== '') {
          e.preventDefault(); // Prevent default action for Enter/Comma
          props.memberEmails.value = [...props.memberEmails.value, props.newMemberEmail.value.trim()];
          props.newMemberEmail.value = ''; // Clear input after adding
        }
      });
    
      // Handler for deleting emails via backspace
      const handleEmailBackspace = $((e: KeyboardEvent) => {
        if (e.key === 'Backspace' && props.newMemberEmail.value === '' && props.memberEmails.value.length > 0) {
          e.preventDefault(); // Prevent backspace from deleting other text
          props.memberEmails.value = props.memberEmails.value.slice(0, -1); // Remove the last email
        }
      });
    
      // Function to remove individual email chips
      const removeEmailChip = $((index: number) => {
        props.memberEmails.value = props.memberEmails.value.filter((_, i) => i !== index);
      });
  return (
    <>
  {/* Form to invite a new member */}
  <div  class="flex flex-wrap items-center gap-2 p-2 border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-blue-500">
    {/* Render each email as a chip */}
    {props.memberEmails.value.map((email, index) => (
      <div id={index.toString()} key={index} class="bg-orange-200 text-orange-800 px-2 py-1 rounded-full flex items-center gap-1">
        <span>{email}</span>
        <button
          type="button"
          onClick$={() => removeEmailChip(index)}
          class="text-orange-600 hover:text-orange-900"
        >
          &times;
        </button>
      </div>
    ))}

    {/* Input field for new email */}
    <input
      type="text"
      placeholder="Enter member email"
      value={props.newMemberEmail.value}
      onInput$={(e) => (props.newMemberEmail.value = (e.target as HTMLInputElement).value)}
      onKeyPress$={handleEmailKeyPress}
      onKeyDown$={handleEmailBackspace} // Handle backspace for chip deletion
      class="inputbase flex-grow mr-2"
    />
  </div>
  </>
  );
});
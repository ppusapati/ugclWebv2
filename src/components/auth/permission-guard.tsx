// // src/components/auth/permission-guard.tsx
// import { component$, Slot, useVisibleTask$, useStore } from '@builder.io/qwik';
// import { getUser, hasPermission, hasRole } from '~/utils/auth';

// interface PermissionGuardProps {
//   permissions?: string[];
//   roles?: string[];
//   requireAll?: boolean; // If true, user must have ALL permissions/roles. If false, user needs ANY
//   businessId?: string;
//   fallback?: any;
// }

// export const PermissionGuard = component$<PermissionGuardProps>(({
//   permissions = [],
//   roles = [],
//   requireAll = false,
//   businessId,
//   fallback
// }) => {
//   const state = useStore({
//     hasAccess: false,
//     loading: true,
//   });
// console.log(state)
//   useVisibleTask$(async () => {
//     const user = getUser();
//     console.log("Checking permissions for user:", user);
//     if (!user) {
//       state.hasAccess = false;
//       state.loading = false;
//       return;
//     }

//     // Check if user is super admin (has access to everything)
//     if (user.is_super_admin || user.role == "super_admin") {
//       state.hasAccess = true;
//       state.loading = false;
//       return;
//     }
//     console.log("State:", state.hasAccess, "User:", user);
//     let hasRequiredPermissions = true;
//     let hasRequiredRoles = true;

//     // Check permissions
//     if (permissions.length > 0) {
//       if (requireAll) {
//         hasRequiredPermissions = permissions.every(permission => hasPermission(permission));
//       } else {
//         hasRequiredPermissions = permissions.some(permission => hasPermission(permission));
//       }
//     }

//     // Check roles
//     if (roles.length > 0) {
//       if (requireAll) {
//         hasRequiredRoles = roles.every(role => hasRole(role));
//       } else {
//         hasRequiredRoles = roles.some(role => hasRole(role));
//       }
//     }

//     // If business context is required, check business-specific access
//     if (businessId && user.business_roles) {
//       const businessAccess = user.business_roles.find(
//         (access: any) => access.business_vertical_id === businessId
//       );
      
//       if (!businessAccess) {
//         state.hasAccess = false;
//         state.loading = false;
//         return;
//       }

//       // Check business-specific permissions and roles
//       if (permissions.length > 0) {
//         if (requireAll) {
//           hasRequiredPermissions = permissions.every(permission => 
//             businessAccess.permissions?.includes(permission)
//           );
//         } else {
//           hasRequiredPermissions = permissions.some(permission => 
//             businessAccess.permissions?.includes(permission)
//           );
//         }
//       }

//       if (roles.length > 0) {
//         if (requireAll) {
//           hasRequiredRoles = roles.every(role => 
//             businessAccess.roles?.includes(role)
//           );
//         } else {
//           hasRequiredRoles = roles.some(role => 
//             businessAccess.roles?.includes(role)
//           );
//         }
//       }
//     }

//     state.hasAccess = hasRequiredPermissions && hasRequiredRoles;
//     state.loading = false;
//   });

//   if (state.loading) {
//     return (
//       <div class="flex items-center justify-center p-4">
//         <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
//       </div>
//     );
//   }
//   console.log("Final Access State:", state.hasAccess);
//   if (!state.hasAccess) {
//     if (fallback) {
//       return fallback;
//     }
    
//     return (
//       <div class="p-6 text-center">
//         <div class="text-6xl mb-4">🔒</div>
//         <h3 class="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
//         <p class="text-gray-600">
//           You don't have the required permissions to view this content.
//         </p>
//       </div>
//     );
//   }

//   return <Slot />;
// });

// // Utility component for inline permission checks
// export const PermissionCheck = component$<{
//   permissions?: string[];
//   roles?: string[];
//   requireAll?: boolean;
//   businessId?: string;
// }>((props) => {
//   return (
//     <PermissionGuard {...props}>
//       <Slot />
//     </PermissionGuard>
//   );
// });
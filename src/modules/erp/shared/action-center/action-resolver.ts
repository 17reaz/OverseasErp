// export function resolveActionTarget(action: ActionItem) {
//   switch (action.type) {
//     case "medical_pending":
//       return {
//         module: "medical",
//         route: "/dashboard/medical",
//         screen: "process",
//         candidateId: action.candidateId,
//       };

//     case "mofa_pending":
//       return {
//         module: "mofa",
//         route: "/dashboard/mofa",
//         screen: "process",
//         candidateId: action.candidateId,
//       };

//     case "visa_pending":
//       return {
//         module: "visa",
//         route: "/dashboard/visa",
//         screen: "process",
//         candidateId: action.candidateId,
//       };

//     case "candidate_incomplete":
//       return {
//         module: "candidate",
//         route: "/dashboard/candidates",
//         screen: "details",
//         candidateId: action.candidateId,
//       };

//     default:
//       return null;
//   }
// }
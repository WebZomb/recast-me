// Shared with enforcement: diagnostics must not invent a different effective cap.
export const ORIGINAL_PHOTO_DAILY_LIMIT=10;
// Request-local provenance; never persisted or used to change enforcement.
export const CAPACITY_SOURCES=Symbol('capacitySources');
export function capacitySource(env,key,fallback){return env[CAPACITY_SOURCES]?.[key]||fallback;}
export function screeningCapacity(env){
  const raw=env.CONTENT_SCREENING_DAILY_LIMIT;
  const configured=Number(raw||200);
  const valid=Number.isInteger(configured)&&configured>=1&&configured<=1000;
  return {limit:valid?configured:200,source:capacitySource(env,'CONTENT_SCREENING_DAILY_LIMIT',raw?(valid?'environment':'invalid_environment_fallback'):'default')};
}
export function subjectDetectionLimit(env,key,fallback){
  const n=Number(env[key]??fallback);
  if(!Number.isSafeInteger(n)||n<0||n>1000)throw Object.assign(new Error('Photo check unavailable.'),{code:'detection_config',status:503,renderControl:true});
  return n;
}

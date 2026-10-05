// Fetch only the server-flattened preview. Never export a canvas or a private
// order URL: those can carry access credentials or an unintended source image.
export async function protectedPreviewFile(version, fetcher=fetch) {
  if (!/^RC-[A-Z0-9-]+$/i.test(version?.requestId || '') || !version?.accessToken) throw Error('Choose a saved preview first.');
  const response = await fetcher(`/api/request/${encodeURIComponent(version.requestId)}/preview?token=${encodeURIComponent(version.accessToken)}`, {cache:'no-store',referrerPolicy:'no-referrer'});
  const data = await response.json();
  if (!response.ok || data.ok !== true || data.watermarked !== true || !/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(data.image || '') || data.image.length > 16000000) throw Error('A protected preview could not be prepared. Please try again.');
  const bytes=Uint8Array.from(atob(data.image.split(',')[1]), c=>c.charCodeAt(0));
  if(bytes[0]!==255 || bytes[1]!==216 || bytes[2]!==255) throw Error('The preview file could not be read.');
  return {file:new File([bytes], `${version.requestId}-RecastMeAi-preview.jpg`, {type:'image/jpeg'}), image:data.image, id:version.requestId};
}

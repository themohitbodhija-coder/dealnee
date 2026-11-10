// Factory shared by real WASM tests and the Deno entrypoint; no mock decoder in production.
export function createPhotoDecoder({ ImageMagick, MagickFormat, ResourceLimits }) {
  ResourceLimits.width=12000n;
  ResourceLimits.height=12000n;
  ResourceLimits.listLength=16n;
  ResourceLimits.memory=96n*1024n*1024n;
  ResourceLimits.disk=0n;
  ResourceLimits.maxMemoryRequest=96n*1024n*1024n;
  const formats={'image/png':MagickFormat.Png,'image/jpeg':MagickFormat.Jpeg,'image/gif':MagickFormat.Gif,'image/webp':MagickFormat.WebP,'image/avif':MagickFormat.Avif};
  return (bytes,mime)=>{
    const format=formats[mime];
    if(!format)throw new Error('Unsupported image format');
    // Force the selected raster coder rather than auto-detect arbitrary formats.
    return ImageMagick.readCollection(bytes,format,images=>{
      if(!images.length || images.length>16)throw new Error('Too many frames');
      let pixels=0;
      for(const image of images){
        pixels+=image.width*image.height;
        if(image.width<1 || image.height<1 || image.width>12000 || image.height>12000 || pixels>40000000)throw new Error('Image pixel limit exceeded');
        image.autoOrient();
        image.strip();
      }
      const first=images[0];
      return images.write(format,encoded=>({bytes:new Uint8Array(encoded),width:first.width,height:first.height}));
    });
  };
}

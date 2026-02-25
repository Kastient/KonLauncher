/*
 *     MCEF (Minecraft Chromium Embedded Framework)
 *     Copyright (C) 2023 CinemaMod Group
 *
 *     This library is free software; you can redistribute it and/or
 *     modify it under the terms of the GNU Lesser General Public
 *     License as published by the Free Software Foundation; either
 *     version 2.1 of the License, or (at your option) any later version.
 *
 *     This library is distributed in the hope that it will be useful,
 *     but WITHOUT ANY WARRANTY; without even the implied warranty of
 *     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 *     Lesser General Public License for more details.
 *
 *     You should have received a copy of the GNU Lesser General Public
 *     License along with this library; if not, write to the Free Software
 *     Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301
 *     USA
 */

package com.cinemamod.mcef;

import com.mojang.blaze3d.systems.RenderSystem;
import com.mojang.blaze3d.textures.GpuTexture;
import net.minecraft.client.renderer.texture.AbstractTexture;

/**
 * A more efficient texture implementation that directly wraps an existing OpenGL texture ID.
 * This bypasses the normal texture creation pipeline and allows us to use an existing texture
 * directly with Minecraft's rendering system.
 */
public class MCEFDirectTexture extends AbstractTexture {
    private int width;
    private int height;

    /**
     * Point this texture wrapper at an externally managed GPU texture.
     * 
     * @param gpuTexture The texture created and owned by MCEFRenderer
     * @param width The width of the texture
     * @param height The height of the texture
     */
    public void setDirectTexture(GpuTexture gpuTexture, int width, int height) {
        this.texture = gpuTexture;
        this.textureView = gpuTexture != null ? RenderSystem.getDevice().createTextureView(gpuTexture) : null;
        this.width = width;
        this.height = height;
    }
    
    public int getWidth() {
        return width;
    }
    
    public int getHeight() {
        return height;
    }
    
    @Override
    public void close() {
        // Don't close the texture - we don't own it
        this.texture = null;
        this.textureView = null;
    }
}

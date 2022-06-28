class GttTileSourcesController < ApplicationController
  layout 'admin'

  before_action :require_admin

  self.main_menu = false

  def index
    @tile_sources = GttTileSource.sorted
  end

  def new
    @tile_source = GttTileSource.new
  end

  def create
    r = RedmineGtt::Actions::CreateTileSource.(tile_source_params)
    if r.tile_source_created?
      redirect_to gtt_tile_sources_path
    else
      @tile_source = r.tile_source
      render 'new'
    end
  end

  def edit
    @tile_source = GttTileSource.find params[:id]
  end

  def update
    ts = GttTileSource.find params[:id]
    r = RedmineGtt::Actions::UpdateTileSource.(ts, tile_source_params)
    if r.tile_source_updated?
      respond_to do |format|
        format.html {
          flash[:notice] = l(:notice_successful_update)
          redirect_to gtt_tile_sources_path
        }
        format.js { head 200 }
      end
    else
      respond_to do |format|
        format.html {
          @tile_source = r.tile_source
          render 'edit'
        }
        format.js { head 422 }
      end
    end
  end

  def destroy
    ts = GttTileSource.find params[:id]
    ts.destroy
    redirect_to gtt_tile_sources_path
  end


  private

  def tile_source_params
    return {} unless params[:tile_source]

    params[:tile_source].permit( :name, :type, :baselayer, :global, :position,
                                :default, :options_string )
  end
end

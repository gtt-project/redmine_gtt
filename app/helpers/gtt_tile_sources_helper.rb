module GttTileSourcesHelper
  def tile_source_type_select_tag(tile_source)
    options = []
    GttTileSource.types.each do |name|
      options << [l(name, scope: %i(gtt_tile_sources names)), name]
    end

    select_tag('tile_source_type',
               options_for_select(options, tile_source.type),
               :disabled => (tile_source && !tile_source.new_record?),
               :data => {:remote => true, :method => 'get'})

  end

  def tile_source_fields(tile_source, form)
    if tile_source.is_a?(GttTileSource)
      partial = tile_source.class.name.demodulize.underscore + "_fields"
      render partial: partial, locals: { f: form }
    end
  end

  def tile_source_options(tile_source)
    safe_join tile_source.options.to_a.select{
      |k,v| v.present?
    }.map{|k,v|
      "#{k}: #{v}"
    }, "<br />".html_safe
  end
end

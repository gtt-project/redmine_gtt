# frozen_string_literal: true

require 'nokogiri'

module RedmineGtt
  # Strict allowlist sanitizer for tracker icon SVGs.
  #
  # Icons come from the Iconify API or are pasted by admins, and are later
  # embedded into marker SVGs on the client and previewed in the settings
  # UI. Only static vector content survives: no scripts, no event handlers,
  # no external references, no CSS, no embedded rasters.
  module SvgSanitizer
    ALLOWED_ELEMENTS = %w(
      svg g path circle ellipse rect line polyline polygon defs
      lineargradient radialgradient stop title desc
    ).freeze

    ALLOWED_ATTRIBUTES = %w(
      viewbox xmlns width height d points x y x1 y1 x2 y2 cx cy r rx ry
      fill fill-rule fill-opacity stroke stroke-width stroke-linecap
      stroke-linejoin stroke-dasharray stroke-opacity opacity transform
      clip-rule offset stop-color stop-opacity gradientunits
      gradienttransform id
    ).freeze

    module_function

    # Returns the sanitized SVG markup, or nil if the input is not a usable
    # SVG document.
    def sanitize(svg)
      return nil if svg.blank?

      # nonet blocks external fetches; entities are deliberately NOT
      # substituted (no noent), so entity-expansion tricks stay inert
      # references instead of being expanded into the output.
      doc = Nokogiri::XML(svg.to_s) { |config| config.nonet }
      root = doc.root
      return nil unless root && root.name.casecmp('svg').zero?

      sanitize_node!(root)
      root.to_xml(save_with: Nokogiri::XML::Node::SaveOptions::AS_XML)
    rescue Nokogiri::XML::SyntaxError
      nil
    end

    def sanitize_node!(node)
      node.children.each do |child|
        if child.element?
          if ALLOWED_ELEMENTS.include?(child.name.downcase)
            sanitize_node!(child)
          else
            child.remove
          end
        elsif !child.text? && !child.cdata?
          child.remove
        end
      end

      node.attribute_nodes.each do |attr|
        name = attr.name.downcase
        value = attr.value.to_s
        # No event handlers, no namespaced references (xlink:href etc.), no
        # URLs anywhere in attribute values.
        if !ALLOWED_ATTRIBUTES.include?(name) ||
           name.start_with?('on') ||
           attr.namespace ||
           value.match?(/url\s*\(|script|https?:|data:/i)
          attr.remove
        end
      end
    end
  end
end

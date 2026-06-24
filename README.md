# showroom-ia-computer-vision

Antora lab guide content for the [AI Computer Vision Validated Pattern](https://github.com/maximilianoPizarro/ia-computer-vision) workshop Showroom deployment.

## Local preview

```bash
podman run --rm --name antora -v "$PWD:/antora:z" -p 8080:8080 -i -t ghcr.io/juliaaano/antora-viewer
```

## Structure

- `site.yml` — Antora playbook (referenced by the Showroom chart)
- `content/antora.yml` — component descriptor
- `content/modules/ROOT/pages/` — lab pages
